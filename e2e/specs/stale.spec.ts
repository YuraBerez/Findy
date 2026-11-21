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

  test(
    'US-1: marks only cards over N days, not in final stages; a move resets',
    { tag: '@critical' },
    async ({ findy }) => {
      const { board } = findy.pages
      await test.step('US-1.1, 1.2, 1.5', async () => {
        await board.verifyStaleMark('Waiting', await markOf(findy, 'Waiting'))
        await board.verifyStaleMark('Also stale', await markOf(findy, 'Also stale'))
        for (const title of ['Ten days', 'Fresh', 'Edge', 'Offer', 'Rejected'])
          await board.verifyStaleMark(title, null)
      })
      await test.step('US-1.3: a move to another stage removes the mark at once', async () => {
        await board.moveWithMenu('Waiting', 'Technical interview')
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

  test('US-3: change N; invalid values are refused; N stays after a restart', async ({ findy }) => {
    const { board, settings } = findy.pages
    await test.step('3.1: Settings → Board shows 14 at first', async () => {
      await settings.open('Board')
      await settings.verifyDays('14')
    })
    await test.step('3.3: 2, 91 and an empty value are refused', async () => {
      for (const value of ['2', '91', '']) {
        await settings.saveDays(value)
        await settings.verifyDaysError('Enter a whole number from 3 to 90.')
      }
    })
    await test.step('3.2: 7 applies at once (spec 018 FR-013: on Enter)', async () => {
      await settings.saveDays('7')
      await settings.close()
      await board.verifyStaleMark('Ten days', await markOf(findy, 'Ten days', 7))
      await board.verifyStaleMark('Fresh', null)
    })
    await test.step('3.2: and after a restart', async () => {
      const pages = await findy.restart()
      await pages.board.verifyStaleMark('Ten days', await markOf(findy, 'Ten days', 7))
      await pages.settings.open('Board')
      await pages.settings.verifyDays('7')
      await pages.settings.close()
    })
  })

  test('US-1.6: a card gets the mark as time passes, without a restart', async ({ findy }) => {
    const { board } = findy.pages
    await findy.api.installClock()
    await findy.refresh()
    await board.verifyStaleMark('Edge', null)
    await findy.api.advanceClock(2 * 24 * 60 * 60 * 1000) // the hourly tick fires
    await board.verifyStaleMark('Edge', 'No movement for 1[56] days')
  })

  test('US-4.1, spec 018 FR-013: the field saves when it loses focus', async ({ findy }) => {
    const { board, settings } = findy.pages
    await settings.open('Board')
    await settings.setDays('30')
    await settings.chooseCategory('General')
    await settings.close()
    // 19–20 and 29–30 whole days: not more than 30
    await board.verifyStaleMark('Waiting', null)
    await board.verifyStaleMark('Also stale', null)
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

    test('US-4.3: the mark in Ukrainian with plurals; the board fits 800 × 600', async ({
      findy,
    }) => {
      await findy.pages.board.verifyStaleMark('Waiting', 'Без руху \\d+ (день|дні|днів)')
      await findy.api.setWindowSize(800, 600)
      expect(await findy.api.hasHorizontalScroll()).toBe(false)
    })
  })
})
