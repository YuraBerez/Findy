import { expect, test } from '../fixtures/app'

// NFR-002: 1 000 applications and 10 000 notes; NFR-003: cold start under 3 s.
// CI runners are shared and slow, so the limits are 3× there.
const SLOW = process.env.CI ? 3 : 1
const limit = (ms: number) => ms * SLOW

async function timed(run: () => Promise<unknown>): Promise<number> {
  const start = performance.now()
  await run()
  return Math.round(performance.now() - start)
}

test.describe('performance with 1 000 applications', { tag: '@perf' }, () => {
  test.use({ bulkData: { applications: 1000, notesEach: 10 } })

  test('NFR-002/003: start, render, move and search stay fast', async ({ findy }, testInfo) => {
    test.slow()
    const results: Record<string, number> = {}

    await test.step('the data is all there', async () => {
      const state = await findy.api.state()
      expect(state.applications).toHaveLength(1000)
      expect(state.applications.reduce((sum, item) => sum + item.notes.length, 0)).toBe(10_000)
    })

    await test.step('NFR-003: cold start to a usable board', async () => {
      results.coldStartMs = await timed(async () => {
        const { board } = await findy.restart()
        await board.verifyColumnCount('applied', 143)
      })
      expect(results.coldStartMs).toBeLessThan(limit(3000))
    })

    await test.step('NFR-002: the full board renders after a reload', async () => {
      results.reloadMs = await timed(async () => {
        await findy.refresh()
        await findy.pages.board.verifyColumnCount('rejected', 142)
      })
      expect(results.reloadMs).toBeLessThan(limit(1000))
    })

    await test.step('a move is saved and shown quickly', async () => {
      results.moveMs = await timed(async () => {
        await findy.pages.board.moveWithMenu('Position 0', 'Offer')
        await findy.pages.board.verifyColumnCount('offered', 144)
      })
      expect(results.moveMs).toBeLessThan(limit(1000))
      // Spec 013: the first move to Offer asks if Findy helped
      await findy.pages.offerDialog.answer('Not now')
    })

    await test.step('search filters 1 000 cards quickly', async () => {
      results.searchMs = await timed(async () => {
        await findy.pages.board.search('Position 999')
        await findy.pages.board.verifyCards('offered', ['Position 999']) // 999 % 7 = 5: Offer
      })
      expect(results.searchMs).toBeLessThan(limit(1000))
    })

    // Bulk data: stage i % 7, created (i % 30) days ago; "Position 0" was moved to Offer above
    await test.step('spec 005 NFR-003: analytics opens and changes its period quickly', async () => {
      const { analytics } = findy.pages
      results.analyticsOpenMs = await timed(async () => {
        await analytics.openTab('Analytics')
        await analytics.verifyTotals({
          applications: 1000,
          interviews: 429,
          offers: 144,
          rejections: 142,
        })
      })
      expect(results.analyticsOpenMs).toBeLessThan(limit(300))
      results.analyticsPeriodMs = await timed(async () => {
        await analytics.selectPeriod('Last 7 days')
        await analytics.verifyTotals({
          applications: 238,
          interviews: 102,
          offers: 35,
          rejections: 34,
        })
      })
      expect(results.analyticsPeriodMs).toBeLessThan(limit(300))
    })

    await testInfo.attach('performance.json', {
      body: JSON.stringify(results, null, 2),
      contentType: 'application/json',
    })
    console.log('performance:', results)
  })
})
