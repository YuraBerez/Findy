import { describe, expect, it } from 'vitest'
import { filterApplications, matchesQuery, toFullIndex } from '../../src/domain/search'
import type { Application } from '../../src/domain/types'

const app = (
  id: string,
  title: string,
  company: string,
  order: number,
  stage: Application['stage'] = 'applied',
): Application => ({
  id,
  title,
  company,
  url: null,
  stage,
  order,
  stageHistory: [{ stage, at: '2026-11-10T00:00:00Z' }],
  notes: [],
  createdAt: '2026-11-10T00:00:00Z',
  updatedAt: '2026-11-10T00:00:00Z',
})

describe('search (FR-060)', () => {
  const acme = app('1', 'Frontend Developer', 'Acme', 0)
  const globex = app('2', 'Backend Engineer', 'Globex', 1)
  const uk = app('3', 'Розробник', 'Нова Пошта', 2)

  it('matches title or company, case-insensitive, trimmed', () => {
    expect(matchesQuery(acme, 'acm')).toBe(true)
    expect(matchesQuery(acme, '  FRONTEND ')).toBe(true)
    expect(matchesQuery(acme, 'globex')).toBe(false)
    expect(matchesQuery(uk, 'пошта')).toBe(true)
    expect(matchesQuery(uk, 'РОЗРОБ')).toBe(true)
  })

  it('an empty query shows everything', () => {
    expect(filterApplications([acme, globex], '   ')).toEqual([acme, globex])
    expect(filterApplications([acme, globex], 'acm')).toEqual([acme])
  })
})

describe('toFullIndex', () => {
  // Column: A(0) b(1) C(2) d(3); the filter shows A and C
  const all = [
    app('A', 'A', 'x', 0),
    app('b', 'b', 'x', 1),
    app('C', 'C', 'x', 2),
    app('d', 'd', 'x', 3),
  ]
  const shown = [all[0]!, all[2]!]

  it('drops before the shown card that follows', () => {
    expect(toFullIndex(all, shown, 'C', { stage: 'applied', index: 0 })).toBe(0) // before A
    expect(toFullIndex(all, shown, 'A', { stage: 'applied', index: 1 })).toBe(3) // after C, at the end
  })

  it('into another column', () => {
    const other = [...all, app('z', 'z', 'x', 0, 'offered'), app('y', 'y', 'x', 1, 'offered')]
    const visible = [...shown, other[5]!] // only y is shown in Offer
    expect(toFullIndex(other, visible, 'A', { stage: 'offered', index: 0 })).toBe(1) // before y, after z
  })
})
