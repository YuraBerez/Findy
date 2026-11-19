import { staleDays } from '../../src/domain/stale'
import { expect, test, type Findy, type HistoryApplication } from '../fixtures/app'

// Events are at noon, days back from today (e2e/data/history-database.ts), so a card's
// whole days depend on the hour of the run: tests read them with the same domain rule.
const HISTORY: HistoryApplication[] = [
  { title: 'Waiting', createdDaysAgo: 20, moves: [['hr_interview', 20]] },
  { title: 'Also stale', createdDaysAgo: 30 },
  { title: 'Ten days', createdDaysAgo: 10 },
  { title: 'Fresh', createdDaysAgo: 3 },
  { title: 'Edge', createdDaysAgo: 14 }, // 13 or 14 whole days: never more than 14
  { title: 'Offer', createdDaysAgo: 100, moves: [['offered', 100]] },
  { title: 'Rejected', createdDaysAgo: 100, moves: [['rejected', 100]] },
  { title: 'Hidden', createdDaysAgo: 30, moves: [['test_task', 30]] },
]

/** The mark text for a title, from the saved state and the stale rule */
async function markOf(findy: Findy, title: string, afterDays = 14): Promise<string> {
  const application = (await findy.api.state()).applications.find((item) => item.title === title)
  const days = staleDays(application!, afterDays, new Date())
  expect(days, `${title} should be stale`).not.toBeNull()
  return `No movement for ${days} days`
}

test.describe('stale applications (spec 010)', () => {
  test.use({ history: { applications: HISTORY } })

  test.beforeEach(async ({ findy }) => {
    // FR-010: hidden columns do not count
    await findy.api.setHiddenStages(['test_task'])
    await findy.refresh()
  })

  test(
    'US-1, US-2: marks, the toggle with the search, a move resets',
    { tag: '@critical' },
    async ({ findy }) => {
      const { board } = findy.pages
      await test.step('US-1.1, 1.2, 1.5: only cards over N days, not in final stages', async () => {
        await board.verifyStaleMark('Waiting', await markOf(findy, 'Waiting'))
        await board.verifyStaleMark('Also stale', await markOf(findy, 'Also stale'))
        for (const title of ['Ten days', 'Fresh', 'Edge', 'Offer', 'Rejected'])
          await board.verifyStaleMark(title, null)
        await board.verifyStaleToggle(2, false) // "Hidden" is in a hidden column
      })
      await test.step('US-2.2: the toggle shows only stale cards, in their columns', async () => {
        await board.toggleStale()
        await board.verifyStaleToggle(2, true)
        await board.verifyCards('applied', ['Also stale'])
        await board.verifyCards('hr_interview', ['Waiting'])
        await board.verifyCards('offered', [])
      })
      await test.step('US-2.3: with the search, both must match', async () => {
        await board.search('wait')
        await board.verifyCards('applied', [])
        await board.verifyCards('hr_interview', ['Waiting'])
        await board.clearSearchWithEscape()
      })
      await test.step('US-1.3, US-2.4: a move resets the count; the card leaves', async () => {
        await board.moveWithMenu('Waiting', 'Technical interview')
        await board.verifyCards('technical_interview', [])
        await board.verifyStaleToggle(1, true)
      })
      await test.step('US-2.5: at 0 the toggle turns off and the board is whole', async () => {
        await board.moveWithMenu('Also stale', 'HR interview')
        await board.verifyStaleToggle(0, false)
        await board.verifyCards('technical_interview', ['Waiting'])
        await board.verifyStaleMark('Waiting', null)
      })
    },
  )

  test('US-1.4: a note or an edit does not reset the count', async ({ findy }) => {
    const { board } = findy.pages
    await findy.api.addNote('Waiting', 'Follow-up sent')
    await findy.api.setColor('Waiting', 'blue')
    await findy.refresh()
    await board.verifyStaleMark('Waiting', await markOf(findy, 'Waiting'))
  })

  test('US-2.6: the toggle is off after a restart', async ({ findy }) => {
    await findy.pages.board.toggleStale()
    await findy.pages.board.verifyStaleToggle(2, true)
    const { board } = await findy.restart()
    await board.verifyStaleToggle(2, false)
  })

  test('US-3: change N; invalid values are refused; N stays after a restart', async ({ findy }) => {
    const { board, staleDialog } = findy.pages
    await test.step('3.1: the dialog shows 14 at first', async () => {
      await board.openStaleAfter()
      await staleDialog.verifyOpen('14')
    })
    await test.step('3.3: 2, 91 and an empty value are refused', async () => {
      for (const value of ['2', '91', '']) {
        await staleDialog.setDays(value)
        await staleDialog.save()
        await staleDialog.verifyError('Enter a whole number from 3 to 90.')
      }
    })
    await test.step('3.2: 7 applies at once', async () => {
      await staleDialog.setDays('7')
      await staleDialog.save()
      await staleDialog.verifyClosed()
      await board.verifyStaleMark('Ten days', await markOf(findy, 'Ten days', 7))
      await board.verifyStaleToggle(4, false) // "Edge" (13 or 14 days) too
    })
    await test.step('3.2: and after a restart', async () => {
      const pages = await findy.restart()
      await pages.board.verifyStaleToggle(4, false)
      await pages.board.openStaleAfter()
      await pages.staleDialog.verifyOpen('7')
      await pages.staleDialog.cancel()
    })
  })

  test('US-1.6: a card gets the mark as time passes, without a restart', async ({ findy }) => {
    const { board } = findy.pages
    await findy.api.installClock()
    await findy.refresh()
    await board.verifyStaleMark('Edge', null)
    await findy.api.advanceClock(2 * 24 * 60 * 60 * 1000) // the hourly tick fires
    await board.verifyStaleMark('Edge', 'No movement for 1[56] days')
    await board.verifyStaleToggle(3, false)
  })

  test('US-4.1: the toggle and the dialog work with the keyboard', async ({ findy }) => {
    const { board, staleDialog } = findy.pages
    await board.toggleStaleWithKeyboard()
    await board.verifyStaleToggle(2, true)
    await board.openStaleAfter()
    await staleDialog.saveWithKeyboard('30')
    await staleDialog.verifyClosed()
    await board.verifyStaleToggle(0, false)
  })

  for (const theme of ['light', 'dark'] as const) {
    test(
      `stale coloured cards have no violations (${theme})`,
      { tag: '@a11y' },
      async ({ findy }) => {
        await findy.api.setTheme(theme)
        await findy.api.setColor('Waiting', 'yellow')
        await findy.api.setColor('Also stale', 'red')
        await findy.refresh()
        await findy.pages.board.verifyTheme(theme)
        await findy.pages.a11y.expectNoViolations()
      },
    )
  }

  test.describe('in Ukrainian', () => {
    test.use({ systemLocale: 'uk-UA' })

    test('US-4.3: mark and toggle in Ukrainian; the toolbar fits 800 × 600', async ({ findy }) => {
      const { board } = findy.pages
      await board.verifyStaleMark('Waiting', 'Без руху \\d+ (день|дні|днів)')
      await board.verifyStaleToggle(2, false)
      await findy.api.setWindowSize(800, 600)
      expect(await findy.api.hasHorizontalScroll()).toBe(false)
    })
  })
})
