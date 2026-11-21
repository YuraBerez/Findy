// Spec 014: salary, work format, location, source and contact of an application
import { expect, test } from '../fixtures/app'

// ICU puts a normal, a no-break or a narrow no-break space around the range dash
const S = '[\\s\\u00a0\\u202f]?'

test.describe('application fields (spec 014)', () => {
  test(
    'US-1, US-2: salary, work format and location in the details and on the card',
    { tag: '@critical' },
    async ({ findy }) => {
      const { board, details } = findy.pages
      await findy.api.seed([{ title: 'Dev', company: 'Acme' }])
      await findy.refresh()
      await board.verifyCardFieldsLine('Dev', null)

      await test.step('US-1.1, US-2.1, US-2.2: a range with currency and period', async () => {
        await board.openCard('Dev')
        await details.editFields({
          salaryFrom: '3000',
          salaryTo: '4 000',
          currency: 'USD',
          period: 'Per month',
          workFormat: 'Hybrid',
          location: 'EU time zone',
        })
        await details.verifySaved()
        // The typed text stays until the panel opens again
        await details.verifyExtraFields({
          salaryFrom: '3000',
          salaryTo: '4 000',
          location: 'EU time zone',
        })
        await details.close()
        await board.verifyCardFieldsLine(
          'Dev',
          new RegExp(`^Hybrid · \\$3,000${S}–${S}\\$4,000/mo$`),
        )
      })

      await test.step('US-1.2: only "from", then only "to"', async () => {
        await board.openCard('Dev')
        await details.editFields({ salaryTo: '' })
        await details.close()
        await board.verifyCardFieldsLine('Dev', /^Hybrid · from \$3,000\/mo$/)
        await board.openCard('Dev')
        await details.editFields({ salaryFrom: '', salaryTo: '4000', period: 'Per year' })
        await details.close()
        await board.verifyCardFieldsLine('Dev', /^Hybrid · up to \$4,000\/yr$/)
      })

      await test.step('US-1.3: "from" larger than "to" is not saved', async () => {
        await board.openCard('Dev')
        await details.editFields({ salaryFrom: '5000', salaryTo: '4000' })
        await details.verifyFieldError(
          'salaryFrom',
          '“Salary from” must not be larger than “Salary to”.',
        )
        await details.editFields({ salaryFrom: '3k' })
        await details.verifyFieldError('salaryFrom', 'Enter a whole number, for example 3000.')
        await details.close()
        await board.verifyCardFieldsLine('Dev', /^Hybrid · up to \$4,000\/yr$/)
      })

      await test.step('US-1.4, US-2.3: cleared fields leave the card', async () => {
        await board.openCard('Dev')
        await details.editFields({ salaryFrom: '', salaryTo: '', workFormat: 'Not set' })
        await details.close()
        await board.verifyCardFieldsLine('Dev', null)
      })

      await test.step('the fields stay after a restart', async () => {
        await board.openCard('Dev')
        await details.editFields({ salaryFrom: '50000', currency: 'UAH', workFormat: 'Remote' })
        const { board: next, details: again } = await findy.restart()
        await next.verifyCardFieldsLine('Dev', new RegExp(`^Remote · from ₴50,000/mo$`))
        await next.openCard('Dev')
        await again.verifyExtraFields({
          salaryFrom: '50000',
          currency: 'UAH',
          workFormat: 'Remote',
          location: 'EU time zone',
        })
      })
    },
  )

  test('FR-012: a new salary takes the currency of the last one', async ({ findy }) => {
    const { board, details } = findy.pages
    await findy.api.seed([
      {
        title: 'Paid',
        fields: { salary: { min: 1000, max: null, currency: 'PLN', period: 'month' } },
      },
      { title: 'New' },
    ])
    await findy.refresh()
    await board.openCard('New')
    await details.verifyExtraFields({ currency: 'PLN', period: 'Per month' })
  })

  test('US-3: the source comes from the link and stays as chosen', async ({ findy }) => {
    const { board, details } = findy.pages
    await findy.api.addSite('Acme careers', 'https://careers.acme.com/?q={query}')
    await findy.api.seed([
      { title: 'Djinni job', url: 'https://djinni.co/jobs/123/' },
      { title: 'Acme job', url: 'https://careers.acme.com/jobs/7' },
      { title: 'Other job', url: 'https://example.com/job' },
    ])
    await findy.refresh()

    await test.step('US-3.1: sites, my sites and other sources', async () => {
      await board.openCard('Other job')
      await details.verifyExtraFields({ source: 'Not set' }) // US-3.4
      await details.verifySourceOptions({
        'Job sites': ['Djinni', 'LinkedIn Jobs', 'XING'],
        'My sites': ['Acme careers'],
        'Other sources': ['Referral', 'Company website', 'Recruiter contacted me', 'Other'],
      })
      await details.close()
    })
    await test.step('US-3.2: a known site link', async () => {
      await board.openCard('Djinni job')
      await details.verifyExtraFields({ source: 'Djinni' })
    })
    await test.step('US-3.3: a new link does not change a set source', async () => {
      await details.editFields({ source: 'Referral' })
      await details.edit({ url: 'https://www.linkedin.com/jobs/view/1' })
      await details.verifySaved()
      await details.verifyExtraFields({ source: 'Referral' })
      await details.close()
    })
    await test.step('FR-020: a new link fills an empty source', async () => {
      await board.openCard('Other job')
      await details.edit({ url: 'https://ua.linkedin.com/jobs/view/2' })
      await details.verifySaved()
      await details.verifyExtraFields({ source: 'LinkedIn Jobs' })
      await details.close()
    })
    await test.step('US-3.5: a deleted site of mine stays the source', async () => {
      await findy.api.deleteSite('Acme careers')
      await findy.refresh()
      await board.openCard('Acme job')
      await details.verifyExtraFields({ source: 'Acme careers' })
    })
  })

  test('US-4: the contact; a link opens in the browser', async ({ findy }) => {
    const { board, details } = findy.pages
    await findy.api.seed([{ title: 'Dev' }])
    await findy.refresh()
    await findy.api.captureExternalLinks()

    await board.openCard('Dev')
    await details.editFields({ contactName: 'Olena', contactDetails: 'https://t.me/olena_hr' })
    await details.verifySaved()
    await details.verifyExtraFields({
      contactName: 'Olena',
      contactDetails: 'https://t.me/olena_hr',
    })
    await details.openContactLink()
    expect(await findy.api.openedLinks()).toEqual(['https://t.me/olena_hr'])
  })
})
