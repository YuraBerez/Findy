import { expect, test } from '../fixtures/app'

test.describe('application details (US-4)', () => {
  test(
    'US-4.1: a click opens the details; Enter does too (FR-025)',
    { tag: '@critical' },
    async ({ findy }) => {
      const { board, details } = findy.pages
      await findy.api.seed([
        { title: 'Frontend Developer', company: 'Acme', url: 'https://acme.com/jobs/1' },
      ])
      await findy.refresh()

      await test.step('click', async () => {
        await board.openCard('Frontend Developer')
        await details.verifyOpen('Frontend Developer')
        await details.verifyFields({
          title: 'Frontend Developer',
          company: 'Acme',
          url: 'https://acme.com/jobs/1',
          stage: 'Applied',
        })
        await details.verifyHistory(['Applied'])
        await details.verifyShows(['Acme', 'Created', 'Updated', 'Notes', 'Details'])
      })
      await test.step('Escape closes and focus returns to the card', async () => {
        await details.closeWithEscape()
        await details.verifyClosed()
        await board.verifyCardFocusedAnywhere('Frontend Developer')
      })
      await test.step('Enter opens it again; a click outside closes it', async () => {
        await board.openCardWithEnter('Frontend Developer')
        await details.verifyOpen('Frontend Developer')
        await details.closeByClickingOutside()
        await details.verifyClosed()
      })
    },
  )

  test('US-4.2: edits and a new stage show on the board', async ({ findy }) => {
    const { board, details } = findy.pages
    await findy.api.seed([{ title: 'Dev', company: 'Acme' }])
    await findy.refresh()

    await board.openCard('Dev')
    await details.edit({
      title: 'Senior Dev',
      company: 'Globex',
      url: 'https://globex.com/1',
      stage: 'Test task',
    })
    await details.verifySaved()
    await details.verifyHistory(['Test task', 'Applied']) // newest first
    await details.close()
    await board.verifyCards('test_task', ['Senior Dev'])
    await board.verifyCardShows('Senior Dev', ['Globex'])
  })

  test('US-4.3 and 4.5: the vacancy opens in the browser from the card and the details', async ({
    findy,
  }) => {
    const { board, details } = findy.pages
    await findy.api.seed([
      { title: 'With link', url: 'https://acme.com/jobs/1' },
      { title: 'Without link' },
    ])
    await findy.refresh()
    await findy.api.captureExternalLinks()

    await test.step('FR-016: the card link button', async () => {
      await board.verifyVacancyButton('Without link', false)
      await board.openVacancyFromCard('With link')
      await details.verifyClosed() // the button does not open the card
      expect(await findy.api.openedLinks()).toEqual(['https://acme.com/jobs/1'])
    })
    await test.step('the details button', async () => {
      await board.openCard('With link')
      await details.openVacancy()
      expect(await findy.api.openedLinks()).toEqual([
        'https://acme.com/jobs/1',
        'https://acme.com/jobs/1',
      ])
      await details.close()
      await board.openCard('Without link')
      await details.verifyNoVacancyButton()
    })
  })

  test('US-4.4: delete asks first; Cancel keeps the application', async ({ findy }) => {
    const { board, details } = findy.pages
    await findy.api.seed([{ title: 'Keep me' }, { title: 'Delete me' }])
    await findy.refresh()
    await findy.api.addNote('Delete me', 'gone with it')

    await test.step('cancel', async () => {
      await board.openCard('Keep me')
      await details.delete('cancel')
      await details.verifyOpen('Keep me')
      await details.close()
    })
    await test.step('confirm', async () => {
      await board.openCard('Delete me')
      await details.delete('confirm')
      await details.verifyClosed()
      await board.verifyCards('applied', ['Keep me'])
      const state = await findy.api.state()
      expect(state.applications.map((application) => application.title)).toEqual(['Keep me'])
    })
  })
})
