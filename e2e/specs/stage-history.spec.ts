import { test } from '../fixtures/app'

test.describe('delete stage history entries (spec 021)', () => {
  test(
    'US-1: a wrong entry goes after a confirmation; analytics stops counting it',
    { tag: '@critical' },
    async ({ findy }) => {
      const { board, details, analytics } = findy.pages
      await findy.api.seed([{ title: 'Dev', company: 'Acme' }])
      await findy.api.move('Dev', 'technical_interview', 'hr_interview')
      await findy.refresh()

      await test.step('analytics counts both interviews first', async () => {
        await analytics.openTab('Analytics')
        await analytics.verifyTotals({ applications: 1, interviews: 2, offers: 0, rejections: 0 })
        await analytics.openTab('Board')
      })
      await board.openCard('Dev')

      await test.step('US-1.3: Cancel and Escape change nothing', async () => {
        await details.deleteHistoryEntry('Technical interview', 'cancel')
        await details.deleteHistoryEntry('Technical interview', 'escape')
        await details.verifyHistory(['HR interview', 'Technical interview', 'Applied'])
      })
      await test.step('US-1.1: delete it; the card stays in HR interview', async () => {
        await details.verifyHistoryDeleteMessage(
          'Technical interview',
          'analytics will not count it',
        )
        await details.deleteHistoryEntry('Technical interview', 'confirm')
        await details.verifyHistory(['HR interview', 'Applied'])
        await details.verifyFields({
          title: 'Dev',
          company: 'Acme',
          url: '',
          stage: 'HR interview',
        })
        await details.close()
        await board.verifyCards('hr_interview', ['Dev'])
      })
      await test.step('US-1.2, FR-009: analytics counts one interview', async () => {
        await analytics.openTab('Analytics')
        await analytics.verifyTotals({ applications: 1, interviews: 1, offers: 0, rejections: 0 })
      })
    },
  )

  test('US-2: the last entry goes; the card goes back on top of the previous stage', async ({
    findy,
  }) => {
    const { board, details } = findy.pages
    await findy.api.seed([
      { title: 'Dev', company: 'Acme' },
      { title: 'Other', company: 'Globex', stage: 'hr_interview' },
    ])
    await findy.api.move('Dev', 'hr_interview', 'offered')
    await findy.api.move('Other', 'hr_interview')
    await findy.refresh()
    await board.openCard('Dev')

    await details.verifyHistoryDeleteMessage('Offer', 'goes back to “HR interview”')
    await details.deleteHistoryEntry('Offer', 'confirm')
    await details.verifyHistory(['HR interview', 'Applied'])
    await test.step('the form shows the new stage, so saving keeps it', async () => {
      await details.verifyFields({ title: 'Dev', company: 'Acme', url: '', stage: 'HR interview' })
      await details.edit({ company: 'Acme Corp' })
      await details.verifySaved()
      await details.verifyHistory(['HR interview', 'Applied'])
    })
    await details.close()
    await board.verifyCards('hr_interview', ['Dev', 'Other'])
    await board.verifyCards('offered', [])
  })

  test('US-3: equal neighbours merge into the earlier entry', async ({ findy }) => {
    const { board, details } = findy.pages
    await findy.api.seed([{ title: 'Dev', company: 'Acme' }])
    await findy.api.move('Dev', 'hr_interview', 'applied')
    await findy.refresh()
    await board.openCard('Dev')

    await details.deleteHistoryEntry('HR interview', 'confirm')
    await details.verifyHistory(['Applied'])
    await test.step('US-4: the only entry has no delete button', async () => {
      await details.verifyNoHistoryDelete()
    })
  })

  test('US-5: delete with the keyboard; the focus goes to the history', async ({ findy }) => {
    const { board, details } = findy.pages
    await findy.api.seed([{ title: 'Dev', company: 'Acme' }])
    await findy.api.move('Dev', 'test_task')
    await findy.refresh()
    await board.openCard('Dev')

    await details.deleteNewestHistoryEntryWithKeyboard('Test task')
    await details.verifyHistory(['Applied'])
    await details.verifyHistoryFocused()
  })
})
