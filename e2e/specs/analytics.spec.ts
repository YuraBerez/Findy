import { expect, test, type HistoryApplication } from '../fixtures/app'

// Days are counted back from today; every event is at noon (e2e/data/history-database.ts)
const HISTORY: HistoryApplication[] = [
  { title: 'A', createdDaysAgo: 0 },
  { title: 'B', createdDaysAgo: 0 },
  { title: 'C', createdDaysAgo: 0, moves: [['hr_interview', 0]] },
  { title: 'D', createdDaysAgo: 1, moves: [['technical_interview', 1]] },
  {
    title: 'E',
    createdDaysAgo: 1,
    moves: [
      ['hr_interview', 1],
      ['rejected', 0],
    ],
  },
  {
    title: 'F',
    createdDaysAgo: 10,
    moves: [
      ['hr_interview', 9],
      ['technical_interview', 8],
      ['offered', 0],
    ],
  },
  { title: 'Old', createdDaysAgo: 200 },
]

test.describe('analytics (spec 005)', () => {
  test.describe('with history', () => {
    test.use({ history: { applications: HISTORY } })

    test('US-1: tabs switch views with the mouse, arrows and shortcuts', async ({ findy }) => {
      const { analytics, board } = findy.pages

      await test.step('1.1: the board is selected at start', async () => {
        await analytics.verifySelectedTab('Board')
        await analytics.verifyBoardShown()
      })
      await test.step('1.2 and FR-004: analytics replaces the board and its actions', async () => {
        await analytics.openTab('Analytics')
        await analytics.verifySelectedTab('Analytics')
        await analytics.verifyShown()
        await analytics.verifyBoardActionsHidden()
      })
      await test.step('1.3: Left and Right move between tabs', async () => {
        await analytics.pressOnTab('Analytics', 'ArrowLeft')
        await analytics.verifySelectedTab('Board', true)
        await analytics.verifyBoardShown()
        await analytics.pressOnTab('Board', 'ArrowRight')
        await analytics.verifySelectedTab('Analytics', true)
      })
      await test.step('1.4: Ctrl/Cmd+1 and Ctrl/Cmd+2', async () => {
        await analytics.pressShortcut(1)
        await analytics.verifyBoardShown()
        await analytics.pressShortcut(2)
        await analytics.verifyShown()
      })
      await test.step('1.5: the board keeps its search', async () => {
        await analytics.pressShortcut(1)
        await board.search('Old')
        await analytics.openTab('Analytics')
        await analytics.openTab('Board')
        await board.verifySearch('Old')
      })
      await test.step('1.6: no shortcut under the modal details panel', async () => {
        await board.openCard('Old')
        await findy.pages.details.pressShortcut('ControlOrMeta+2')
        await findy.pages.details.verifyOpen('Old')
        await analytics.verifySelectedTab('Board')
      })
    })

    test(
      'US-2, US-4, US-5: activity, funnel and totals of a period',
      { tag: '@critical' },
      async ({ findy }) => {
        const { analytics } = findy.pages
        await analytics.openTab('Analytics')

        await test.step('US-6.1: last 30 days by day is the default', async () => {
          await analytics.verifyFilters('30d', 'day')
          await analytics.verifyTotals({ applications: 6, interviews: 5, offers: 1, rejections: 1 })
        })
        await test.step('2.1: 3 today, 2 yesterday, 0 on the other days', async () => {
          await analytics.selectPeriod('Last 7 days')
          await analytics.readBarWithKeyboard('Applications sent', ['End'], /: 3 applications$/)
          await analytics.readBarWithKeyboard(
            'Applications sent',
            ['ArrowLeft'],
            /: 2 applications$/,
          )
          await analytics.verifyTable('Applications sent', [
            ...Array.from({ length: 5 }, () => [/./, '0']),
            [/./, '2'],
            [/./, '3'],
          ])
        })
        await test.step('US-5: totals of the 7 days', async () => {
          await analytics.verifyTotals({ applications: 5, interviews: 3, offers: 1, rejections: 1 })
        })
        await test.step('spec 022 FR-001…FR-003: days since "Old", in each period', async () => {
          await analytics.verifySearchDays(201)
          await analytics.selectPeriod('All time')
          await analytics.verifySearchDays(201)
          await analytics.selectPeriod('Last 7 days')
        })
        await test.step('4.1…4.3: reached a stage or a later one; rejected apart', async () => {
          await analytics.verifyFunnel(
            [
              ['Applied', 5, '100%'],
              ['HR interview', 3, '60%'],
              ['Test task', 1, '20%'],
              ['Technical interview', 1, '20%'],
              ['C-level interview', 0, '0%'],
              ['Offer', 0, '0%'],
            ],
            1,
          )
        })
        await test.step('2.2: grouped by week', async () => {
          await analytics.selectGrouping('Week')
          // Yesterday is in this week, unless today is Monday
          const thisWeek = new Date().getDay() === 1 ? 3 : 5
          await analytics.readBarWithKeyboard(
            'Applications sent',
            ['End'],
            new RegExp(`–.+: ${thisWeek} applications$`),
          )
        })
      },
    )

    test('US-3: stage entries over time, with legend toggles', async ({ findy }) => {
      const { analytics } = findy.pages
      await analytics.openTab('Analytics')
      await analytics.selectPeriod('Last 7 days')
      const chart = 'Stages over time'

      await test.step('3.1, 3.2: each entry counts on its own day', async () => {
        await analytics.readBarWithKeyboard(
          chart,
          ['End'],
          /: Applied: 3, HR interview: 1, Offer: 1, Rejected: 1$/,
        )
        await analytics.readBarWithKeyboard(
          chart,
          ['ArrowLeft'],
          /: Applied: 2, HR interview: 1, Technical interview: 1$/,
        )
      })
      await test.step('3.3: turn a stage off in the legend', async () => {
        await analytics.toggleLegend(chart, 'HR interview')
        await analytics.verifyLegend(chart, ['Applied', 'Offer'], ['HR interview'])
        await analytics.readBarWithKeyboard(chart, ['End'], /: Applied: 3, Offer: 1, Rejected: 1$/)
      })
    })

    test('US-6.4: period and grouping persist across restarts', async ({ findy }) => {
      await findy.pages.analytics.openTab('Analytics')
      await findy.pages.analytics.selectPeriod('Last 90 days')
      await findy.pages.analytics.selectGrouping('Month')
      const { analytics } = await findy.restart()
      await analytics.openTab('Analytics')
      await analytics.verifyFilters('90d', 'month')
    })

    test('NFR-005: analytics fits the minimum window', async ({ findy }) => {
      await findy.api.setWindowSize(800, 600)
      await findy.pages.analytics.openTab('Analytics')
      await findy.pages.analytics.verifyFitsWindow()
      expect(await findy.api.hasHorizontalScroll()).toBe(false)
    })

    test('FR-015: hidden columns are not in the stages chart and the funnel', async ({ findy }) => {
      await findy.api.setHiddenStages(['test_task'])
      await findy.refresh()
      const { analytics } = findy.pages
      await analytics.openTab('Analytics')
      await analytics.selectPeriod('Last 7 days')
      await analytics.verifyFunnel(
        [
          ['Applied', 5, '100%'],
          ['HR interview', 3, '60%'],
          ['Technical interview', 1, '20%'],
          ['C-level interview', 0, '0%'],
          ['Offer', 0, '0%'],
        ],
        1,
      )
      await analytics.verifyTotals({ applications: 5, interviews: 3, offers: 1, rejections: 1 })
    })
  })

  test.describe('with old data only', () => {
    test.use({ history: { applications: [{ title: 'Old', createdDaysAgo: 200 }] } })

    test('US-7.2: no activity in the period', async ({ findy }) => {
      const { analytics } = findy.pages
      await analytics.openTab('Analytics')
      await analytics.verifyNoActivity(true)
      await analytics.verifyTotals({ applications: 0, interviews: 0, offers: 0, rejections: 0 })
      await analytics.selectPeriod('All time')
      await analytics.verifyNoActivity(false)
    })
  })

  test('US-7.1 and FR-033: empty state, then a change from MCP', async ({ findy }) => {
    const { analytics } = findy.pages
    await analytics.openTab('Analytics')

    await test.step('7.1: a message and a button that opens the board', async () => {
      await analytics.verifyEmpty()
      await analytics.openBoardFromEmptyState()
      await analytics.verifyBoardShown()
    })
    await test.step('FR-033: an application from the AI assistant shows without a restart', async () => {
      await findy.api.setMcpEnabled(true)
      const mcp = await findy.connectMcp()
      await analytics.openTab('Analytics')
      expect((await mcp.call('add_application', { title: 'Dev', company: 'Acme' })).isError).toBe(
        false,
      )
      await expect(async () =>
        analytics.verifyTotals({ applications: 1, interviews: 0, offers: 0, rejections: 0 }),
      ).toPass({ timeout: 2_500 })
      // Spec 022 US-1.2: an application of today gives day 1
      await analytics.verifySearchDays(1)
    })
  })
})
