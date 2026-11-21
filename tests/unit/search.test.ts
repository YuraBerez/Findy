import { describe, expect, it } from 'vitest'
import { EMPTY_FIELDS } from '../../src/domain/fields'
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
  color: null,
  ...EMPTY_FIELDS,
  stageHistory: [{ stage, at: '2026-11-10T00:00:00Z' }],
  notes: [],
  createdAt: '2026-11-10T00:00:00Z',
  updatedAt: '2026-11-10T00:00:00Z',
})

const CHANNELS = {
  referral: 'Referral',
  company_site: 'Company website',
  recruiter: 'Recruiter contacted me',
  other: 'Other',
}

describe('search (FR-060)', () => {
  const acme = app('1', 'Frontend Developer', 'Acme', 0)
  const globex = app('2', 'Backend Engineer', 'Globex', 1)
  const uk = app('3', 'Розробник', 'Нова Пошта', 2)

  it('matches title or company, case-insensitive, trimmed', () => {
    expect(matchesQuery(acme, 'acm', CHANNELS)).toBe(true)
    expect(matchesQuery(acme, '  FRONTEND ', CHANNELS)).toBe(true)
    expect(matchesQuery(acme, 'globex', CHANNELS)).toBe(false)
    expect(matchesQuery(uk, 'пошта', CHANNELS)).toBe(true)
    expect(matchesQuery(uk, 'РОЗРОБ', CHANNELS)).toBe(true)
  })

  it('an empty query shows everything', () => {
    expect(filterApplications([acme, globex], '   ', CHANNELS)).toEqual([acme, globex])
    expect(filterApplications([acme, globex], 'acm', CHANNELS)).toEqual([acme])
  })
})

describe('search in the extra fields (spec 014 FR-040)', () => {
  const dev = {
    ...app('1', 'Dev', 'Acme', 0),
    location: 'Lviv',
    contactName: 'Olena',
    contactDetails: 'olena@acme.com',
    salary: { min: 3000, max: null, currency: 'USD' as const, period: 'month' as const },
  }
  it('matches location, contact and the source name, not amounts', () => {
    expect(matchesQuery(dev, 'lviv', CHANNELS)).toBe(true)
    expect(matchesQuery(dev, 'OLENA', CHANNELS)).toBe(true)
    expect(matchesQuery(dev, '@acme.com', CHANNELS)).toBe(true)
    expect(matchesQuery(dev, '3000', CHANNELS)).toBe(false)
    expect(matchesQuery({ ...dev, source: { kind: 'site', id: 'djinni' } }, 'djin', CHANNELS)).toBe(
      true,
    )
    expect(
      matchesQuery(
        { ...dev, source: { kind: 'custom', name: 'Acme careers' } },
        'careers',
        CHANNELS,
      ),
    ).toBe(true)
    expect(
      matchesQuery({ ...dev, source: { kind: 'channel', id: 'referral' } }, 'refer', CHANNELS),
    ).toBe(true)
    expect(matchesQuery({ ...dev, source: null }, 'refer', CHANNELS)).toBe(false)
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
