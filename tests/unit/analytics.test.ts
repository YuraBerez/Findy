import { describe, expect, it } from 'vitest'
import {
  analytics,
  bucketStart,
  buckets,
  dateKey,
  DEFAULT_ANALYTICS_VIEW,
  isAnalyticsGrouping,
  isAnalyticsPeriod,
  periodRange,
  type AnalyticsView,
} from '../../src/domain/analytics'
import type { StageId } from '../../src/domain/stages'
import type { Application } from '../../src/domain/types'

// Local dates, so the tests pass in every time zone (FR-012)
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).toISOString()
const NOW = new Date(2026, 10, 18, 15) // Wednesday, 18 Nov 2026

let seq = 0
function appWith(created: string, stageHistory: { stage: StageId; at: string }[]): Application {
  return {
    id: `id-${++seq}`,
    title: 't',
    company: 'c',
    url: null,
    stage: stageHistory.at(-1)!.stage,
    order: 0,
    color: null,
    stageHistory,
    notes: [],
    createdAt: created,
    updatedAt: created,
  }
}

/** Created in Applied, then moved through `moves` */
function history(created: string, ...moves: [StageId, string][]): Application {
  return appWith(created, [
    { stage: 'applied', at: created },
    ...moves.map(([stage, when]) => ({ stage, at: when })),
  ])
}

const app = (created: string) => history(created)

const run = (
  applications: Application[],
  view: Partial<AnalyticsView> = {},
  hiddenStages: StageId[] = [],
) =>
  analytics({ applications, hiddenStages, view: { ...DEFAULT_ANALYTICS_VIEW, ...view }, now: NOW })

describe('analytics settings (FR-030, FR-031)', () => {
  it('defaults to the last 30 days by day (US-6.1)', () => {
    expect(DEFAULT_ANALYTICS_VIEW).toEqual({ period: '30d', grouping: 'day' })
  })

  it('recognises periods and groupings', () => {
    expect(isAnalyticsPeriod('90d')).toBe(true)
    expect(isAnalyticsPeriod('1y')).toBe(false)
    expect(isAnalyticsGrouping('month')).toBe(true)
    expect(isAnalyticsGrouping(1)).toBe(false)
  })
})

describe('calendar (FR-012, FR-013)', () => {
  it('starts weeks on Monday and months on the 1st', () => {
    const sunday = new Date(2026, 10, 22, 23)
    expect(dateKey(bucketStart(sunday, 'day'))).toBe('2026-11-22')
    expect(dateKey(bucketStart(sunday, 'week'))).toBe('2026-11-16')
    expect(dateKey(bucketStart(new Date(2026, 10, 16), 'week'))).toBe('2026-11-16')
    expect(dateKey(bucketStart(sunday, 'month'))).toBe('2026-11-01')
  })

  it('"Last N days" includes today and N − 1 days before it', () => {
    const range = periodRange('7d', NOW, [])
    expect(dateKey(range.start)).toBe('2026-11-12')
    expect(dateKey(range.end)).toBe('2026-11-19')
    expect(buckets(range, 'day').map((bucket) => bucket.key)).toEqual([
      '2026-11-12',
      '2026-11-13',
      '2026-11-14',
      '2026-11-15',
      '2026-11-16',
      '2026-11-17',
      '2026-11-18',
    ])
  })

  it('"All time" starts on the day of the oldest application, or today', () => {
    expect(
      dateKey(periodRange('all', NOW, [app(at(2026, 9, 3)), app(at(2026, 11, 1))]).start),
    ).toBe('2026-09-03')
    expect(dateKey(periodRange('all', NOW, []).start)).toBe('2026-11-18')
  })

  it('groups by week and month, with partial first buckets', () => {
    const range = periodRange('30d', NOW, [])
    expect(buckets(range, 'week').map((bucket) => bucket.key)).toEqual([
      '2026-10-19',
      '2026-10-26',
      '2026-11-02',
      '2026-11-09',
      '2026-11-16',
    ])
    expect(buckets(range, 'month').map((bucket) => bucket.key)).toEqual([
      '2026-10-01',
      '2026-11-01',
    ])
  })

  it('has one bucket per calendar day across a DST change', () => {
    const range = { start: new Date(2026, 2, 27), end: new Date(2026, 2, 31) }
    expect(buckets(range, 'day').map((bucket) => bucket.key)).toEqual([
      '2026-03-27',
      '2026-03-28',
      '2026-03-29',
      '2026-03-30',
    ])
    const range2 = { start: new Date(2026, 9, 24), end: new Date(2026, 9, 27) }
    expect(buckets(range2, 'day')).toHaveLength(3)
  })
})

describe('applications per day (US-2, FR-020)', () => {
  it('counts applications by creation day and shows empty days as 0', () => {
    const data = run(
      [
        app(at(2026, 11, 18, 9)),
        app(at(2026, 11, 18, 10)),
        app(at(2026, 11, 18, 23)),
        app(at(2026, 11, 17, 0)),
        app(at(2026, 11, 17, 8)),
      ],
      { period: '7d' },
    )
    expect(data.activity).toEqual([0, 0, 0, 0, 0, 2, 3])
    expect(data.totals.applications).toBe(5)
  })

  it('leaves out applications created before the period', () => {
    const data = run([app(at(2026, 11, 11)), app(at(2026, 11, 12, 0))], { period: '7d' })
    expect(data.activity[0]).toBe(1)
    expect(data.totals.applications).toBe(1)
  })

  it('groups by week (US-2.2)', () => {
    const data = run(
      [app(at(2026, 11, 16)), app(at(2026, 11, 18)), app(at(2026, 11, 15)), app(at(2026, 10, 20))],
      { period: '30d', grouping: 'week' },
    )
    expect(data.activity).toEqual([1, 0, 0, 1, 2])
  })
})

describe('stages over time (US-3, FR-011, FR-021)', () => {
  it('counts every stage entry on its own date, also repeated ones', () => {
    const data = run(
      [
        history(
          at(2026, 11, 10),
          ['technical_interview', at(2026, 11, 16)],
          ['hr_interview', at(2026, 11, 17)],
          ['technical_interview', at(2026, 11, 18)],
        ),
      ],
      { period: '7d' },
    )
    const tech = data.stages.find((series) => series.stage === 'technical_interview')!
    expect(tech.values).toEqual([0, 0, 0, 0, 1, 0, 1])
    // the first entry counts too, but it is outside the period here
    expect(data.stages.find((series) => series.stage === 'applied')!.values).toEqual([
      0, 0, 0, 0, 0, 0, 0,
    ])
  })

  it('counts the first entry of an application created in a later stage', () => {
    const data = run(
      [appWith(at(2026, 11, 18), [{ stage: 'technical_interview', at: at(2026, 11, 18) }])],
      {
        period: '7d',
      },
    )
    expect(
      data.stages.find((series) => series.stage === 'technical_interview')!.values.at(-1),
    ).toBe(1)
    expect(data.totals.interviews).toBe(1)
  })
})

describe('funnel (US-4, FR-022, FR-023)', () => {
  const day = at(2026, 11, 18)
  it('counts the furthest stage for every step before it, with shares', () => {
    const apps = [
      ...Array.from({ length: 36 }, () => app(day)),
      history(day, ['hr_interview', day]),
      history(day, ['hr_interview', day], ['technical_interview', day]),
      history(day, ['technical_interview', day]), // skipped HR and Test task
      history(day, ['hr_interview', day], ['technical_interview', day], ['offered', day]),
    ]
    const data = run(apps)
    expect(data.funnel.map(({ stage, count }) => [stage, count])).toEqual([
      ['applied', 40],
      ['hr_interview', 4],
      ['test_task', 3],
      ['technical_interview', 3],
      ['c_level_interview', 1],
      ['offered', 1],
    ])
    expect(data.funnel[0]!.share).toBe(1)
    expect(data.funnel[1]!.share).toBe(0.1)
    expect(data.funnel[5]!.share).toBe(0.025)
  })

  it('keeps a later stage after a move back; rejected is a separate number', () => {
    const data = run([
      history(day, ['hr_interview', day], ['rejected', day]),
      history(day, ['technical_interview', day], ['applied', day]),
      history(day, ['offered', day], ['rejected', day]),
      appWith(day, [{ stage: 'rejected', at: day }]),
    ])
    expect(data.funnel.map((step) => step.count)).toEqual([4, 3, 2, 2, 1, 1])
    expect(data.rejected).toBe(3)
    expect(data.totals).toEqual({ applications: 4, interviews: 2, offers: 1, rejections: 3 })
  })

  it('uses only applications created in the period', () => {
    const data = run([history(at(2026, 1, 5), ['hr_interview', day])])
    expect(data.funnel[0]!.count).toBe(0)
    expect(data.funnel.every((step) => step.share === 0)).toBe(true)
    expect(data.totals.interviews).toBe(1)
    expect(data.noActivity).toBe(false)
  })
})

describe('hidden stages (FR-015)', () => {
  it('leaves them out of the stages chart and the funnel, but not out of the totals', () => {
    const day = at(2026, 11, 18)
    const data = run([history(day, ['hr_interview', day], ['technical_interview', day])], {}, [
      'applied',
      'hr_interview',
    ])
    expect(data.stages.map((series) => series.stage)).toEqual([
      'test_task',
      'technical_interview',
      'c_level_interview',
      'offered',
      'rejected',
    ])
    expect(data.funnel.map((step) => [step.stage, step.count, step.share])).toEqual([
      ['test_task', 1, 1],
      ['technical_interview', 1, 1],
      ['c_level_interview', 0, 0],
      ['offered', 0, 0],
    ])
    expect(data.activity.at(-1)).toBe(1)
    expect(data.totals.interviews).toBe(2)
  })
})

describe('no activity (FR-041)', () => {
  it('is true when nothing happened in the period', () => {
    expect(run([app(at(2025, 1, 1))], { period: '7d' }).noActivity).toBe(true)
    expect(run([], { period: 'all' }).noActivity).toBe(true)
    expect(run([app(at(2026, 11, 18))], { period: '7d' }).noActivity).toBe(false)
  })
})

describe('performance (NFR-003)', () => {
  it('handles 1 000 applications and 10 000 entries over all time by day quickly', () => {
    const apps = Array.from({ length: 1000 }, (_, i) => {
      const created = new Date(2024, 10, 18 + (i % 700), 10).toISOString()
      const moves: [StageId, string][] = Array.from({ length: 9 }, (_, n) => [
        n % 2 ? 'hr_interview' : 'technical_interview',
        new Date(2024, 10, 18 + (i % 700) + n, 11).toISOString(),
      ])
      return history(created, ...moves)
    })
    const start = performance.now()
    const data = run(apps, { period: 'all', grouping: 'day' })
    expect(performance.now() - start).toBeLessThan(300)
    expect(data.buckets.length).toBeGreaterThan(700)
    expect(data.totals.applications).toBe(1000)
  })
})
