import { expect, test, type Findy } from '../fixtures/app'

/** Pastes `text` into the link field through the system clipboard */
const pasteInto = (findy: Findy) => (text: string) =>
  findy.api.withClipboard(text, () => findy.pages.dialog.pasteLink(text))

const HINT = 'Paste a vacancy link: Findy fills in the job title and the company.'
const FILLED = 'Filled in from the page. Check the values.'
const READING = 'Reading the vacancy page…'
const NOT_FOUND =
  'Could not get the job title or the company from this page. Fill them in yourself.'

test.describe('add an application from a link (spec 009)', () => {
  test(
    'US-1.1, 1.2, SC-001: paste a link, check the values, save',
    { tag: '@critical' },
    async ({ findy, vacancyPages }) => {
      const { board, dialog } = findy.pages
      const paste = pasteInto(findy)
      const link = vacancyPages.url('/jobs/frontend')
      await test.step('paste the link: title and company fill in, the link stays', async () => {
        await board.startAdding()
        await dialog.verifyLinkStatus(HINT) // FR-010
        await paste(link)
        await dialog.verifyValue('title', 'Frontend Developer')
        await dialog.verifyValue('company', 'Acme')
        await dialog.verifyValue('url', link)
        await dialog.verifyLinkStatus(FILLED)
      })
      await test.step('FR-008: nothing is saved before "Add"', async () => {
        await board.verifyCards('applied', [])
        await dialog.submit()
        await dialog.verifyClosed()
        await board.verifyCards('applied', ['Frontend Developer'])
        await board.verifyCardShows('Frontend Developer', ['Acme'])
      })
      await test.step('NFR-001: a later read sends no cookie of the page', async () => {
        await board.startAdding()
        await dialog.fill({ url: link })
        await dialog.fillFromLink()
        await dialog.verifyLinkStatus(FILLED)
        expect(vacancyPages.requests.map((request) => request.cookie)).toEqual([
          undefined,
          undefined,
        ])
      })
    },
  )

  test('US-1.3: typed text stays; only the empty field fills in', async ({
    findy,
    vacancyPages,
  }) => {
    const { board, dialog } = findy.pages
    const paste = pasteInto(findy)
    await board.startAdding()
    await dialog.fill({ title: 'My own title' })
    await paste(vacancyPages.url('/jobs/preview'))
    await dialog.verifyLinkStatus(FILLED)
    await dialog.verifyValue('title', 'My own title')
    // FR-004 step 2: "Senior QA — Globex | Jobs Board" without the site name
    await dialog.verifyValue('company', 'Globex')
  })

  test('US-1.4, FR-007, US-2.3: a slow page, a changed link, a closed dialog', async ({
    findy,
    vacancyPages,
  }) => {
    const { board, dialog } = findy.pages
    const paste = pasteInto(findy)
    const held = vacancyPages.url('/jobs/held')
    await test.step('while the page loads, the status shows and the form works', async () => {
      await board.startAdding()
      await paste(held)
      await dialog.verifyLinkStatus(READING)
      await dialog.verifyFillFromLinkEnabled(false)
      await dialog.fill({ title: 'Typed meanwhile' })
    })
    await test.step('a changed link drops the old answer', async () => {
      await dialog.fill({ url: `${held}?changed` })
      await dialog.verifyLinkStatus(HINT)
      vacancyPages.release()
      await dialog.verifyFillFromLinkEnabled(true)
      await dialog.verifyValue('company', '')
      await dialog.verifyValue('title', 'Typed meanwhile')
    })
    await test.step('closing the dialog while it loads changes nothing', async () => {
      await dialog.fill({ url: '' })
      await paste(held)
      await dialog.verifyLinkStatus(READING)
      await dialog.cancel()
      await dialog.verifyClosed()
      vacancyPages.release()
      await board.verifyCards('applied', [])
      await board.startAdding()
      await dialog.verifyEmpty()
      await dialog.verifyLinkStatus(HINT)
    })
  })

  test('US-1.5: a typed link fills in with "Fill from link"; redirects are followed', async ({
    findy,
    vacancyPages,
  }) => {
    const { board, dialog } = findy.pages
    await board.startAdding()
    await dialog.verifyFillFromLinkEnabled(false)
    await dialog.fill({ url: 'acme jobs' })
    await dialog.verifyFillFromLinkEnabled(false)
    await dialog.fill({ url: vacancyPages.url('/go') })
    await dialog.fillFromLink()
    await dialog.verifyValue('title', 'Frontend Developer')
    await dialog.verifyValue('company', 'Acme')
    expect(vacancyPages.requests.map((request) => request.path)).toEqual(['/go', '/jobs/frontend'])
  })

  test('US-2.1: no data, not HTML, no answer → a short message; the dialog still works', async ({
    findy,
    vacancyPages,
  }) => {
    const { board, dialog } = findy.pages
    const paste = pasteInto(findy)
    await board.startAdding()
    for (const link of [
      vacancyPages.url('/jobs/sign-in'),
      vacancyPages.url('/files/vacancy.pdf'),
      'http://127.0.0.1:9/closed-port', // nothing listens there: like no network
    ]) {
      await paste(link)
      await dialog.verifyLinkStatus(NOT_FOUND)
    }
    await dialog.fill({ title: 'Manual', company: 'Typed' })
    await dialog.submit()
    await board.verifyCards('applied', ['Manual'])
  })

  test('US-2.2: a link that is not http(s) reads nothing', async ({ findy, vacancyPages }) => {
    const { board, dialog } = findy.pages
    const paste = pasteInto(findy)
    await board.startAdding()
    await paste('ftp://example.com/vacancy')
    await dialog.verifyLinkStatus(HINT)
    await dialog.verifyFillFromLinkEnabled(false)
    expect(vacancyPages.requests).toEqual([])
  })

  test('US-3.1: the keyboard reaches "Fill from link" and the filled fields', async ({
    findy,
    vacancyPages,
  }) => {
    const { board, dialog } = findy.pages
    await board.startAdding()
    await dialog.fill({ url: vacancyPages.url('/jobs/frontend') })
    await dialog.fillFromLinkWithKeyboard()
    await dialog.verifyValue('title', 'Frontend Developer')
  })

  test(
    'the dialog with the message has no accessibility violations',
    { tag: '@a11y' },
    async ({ findy, vacancyPages }) => {
      const { board, dialog, a11y } = findy.pages
      const paste = pasteInto(findy)
      await board.startAdding()
      await paste(vacancyPages.url('/jobs/sign-in'))
      await dialog.verifyLinkStatus(NOT_FOUND)
      await a11y.expectNoViolations()
    },
  )

  test.describe('in Ukrainian', () => {
    test.use({ systemLocale: 'uk-UA' })

    test('US-3.2: button and status in Ukrainian; page values as they are', async ({
      findy,
      vacancyPages,
    }) => {
      const { board, dialog } = findy.pages
      const paste = pasteInto(findy)
      await board.startAdding()
      await paste(vacancyPages.url('/jobs/frontend'))
      await dialog.verifyLinkStatus('Заповнено зі сторінки. Перевірте значення.')
      await dialog.verifyValue('title', 'Frontend Developer')
    })
  })
})
