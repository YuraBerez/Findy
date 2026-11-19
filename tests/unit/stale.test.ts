import { describe, expect, it } from 'vitest'
import { filterApplications } from '../../src/domain/search'
import { isStaleAfterDays, STALE_DAYS, staleDays } from '../../src/domain/stale'
import type { Application, StageChange } from '../../src/domain/types'

const NOW = new Date('2026-11-19T12:00:00Z')
const daysAgo = (days: number, extraMs = 0) =>
  new Date(NOW.getTime() - days * 86_400_000 - extraMs).toISOString()

const app = (
  title: string,
  history: StageChange[],
  overrides: Partial<Application> = {},
): Application => ({
  id: title,
  title,
  company: 'Acme',
  url: null,
  stage: history.at(-1)!.stage,
  order: 0,
  color: null,
  stageHistory: history,
  notes: [],
  createdAt: history[0]!.at,
  updatedAt: history[0]!.at,
  ...overrides,
})

describe('staleDays (spec 010 FR-001, FR-002)', () => {
  it('is null up to N whole days, and the day count after that', () => {
    const at = (days: number, extraMs = 0) =>
      staleDays(app('A', [{ stage: 'hr_interview', at: daysAgo(days, extraMs) }]), 14, NOW)
    expect(at(0)).toBeNull()
    expect(at(14)).toBeNull()
    expect(at(14, 23 * 3_600_000)).toBeNull() // 14 days 23 hours: still 14 whole days
    expect(at(15)).toBe(15)
    expect(at(100)).toBe(100)
  })

  it('counts from the last stage change, not from creation, notes or edits', () => {
    const moved = app(
      'A',
      [
        { stage: 'applied', at: daysAgo(40) },
        { stage: 'hr_interview', at: daysAgo(3) },
      ],
      { notes: [], updatedAt: daysAgo(0) },
    )
    expect(staleDays(moved, 14, NOW)).toBeNull()
    const noted = app('B', [{ stage: 'applied', at: daysAgo(20) }], {
      notes: [{ id: 'n', text: 'Follow-up sent', createdAt: daysAgo(1), updatedAt: daysAgo(1) }],
      updatedAt: daysAgo(1),
    })
    expect(staleDays(noted, 14, NOW)).toBe(20)
  })

  it('back and forth: the count starts at the last change', () => {
    const history: StageChange[] = [
      { stage: 'applied', at: daysAgo(60) },
      { stage: 'hr_interview', at: daysAgo(50) },
      { stage: 'applied', at: daysAgo(16) },
    ]
    expect(staleDays(app('A', history), 14, NOW)).toBe(16)
  })

  it('never marks Offer or Rejected (D-3)', () => {
    expect(staleDays(app('O', [{ stage: 'offered', at: daysAgo(100) }]), 14, NOW)).toBeNull()
    expect(staleDays(app('R', [{ stage: 'rejected', at: daysAgo(100) }]), 14, NOW)).toBeNull()
  })

  it('a clock that went back gives no stale mark', () => {
    expect(staleDays(app('A', [{ stage: 'applied', at: daysAgo(-5) }]), 3, NOW)).toBeNull()
  })

  it('uses N', () => {
    const a = app('A', [{ stage: 'test_task', at: daysAgo(8) }])
    expect(staleDays(a, 7, NOW)).toBe(8)
    expect(staleDays(a, 14, NOW)).toBeNull()
  })
})

describe('isStaleAfterDays (FR-008)', () => {
  it.each([3, 14, 90])('accepts %i', (days) => expect(isStaleAfterDays(days)).toBe(true))
  it.each([2, 91, 7.5, Number.NaN, '14', null])('refuses %s', (days) =>
    expect(isStaleAfterDays(days)).toBe(false),
  )
  it('defaults to 14', () => expect(STALE_DAYS.default).toBe(14))
})

describe('filterApplications with the stale toggle (FR-006)', () => {
  const stale = app('Frontend stale', [{ stage: 'applied', at: daysAgo(30) }])
  const fresh = app('Frontend fresh', [{ stage: 'applied', at: daysAgo(1) }])
  const other = app('Backend stale', [{ stage: 'applied', at: daysAgo(30) }])
  const isStale = (application: Application) => staleDays(application, 14, NOW) !== null

  it('keeps only applications that match the query and the condition', () => {
    expect(filterApplications([stale, fresh, other], '', isStale)).toEqual([stale, other])
    expect(filterApplications([stale, fresh, other], 'front', isStale)).toEqual([stale])
    expect(filterApplications([stale, fresh, other], 'front')).toEqual([stale, fresh])
  })
})
