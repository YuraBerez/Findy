import { describe, expect, it } from 'vitest'
import { compareVersions, isCheckDue, isNewer, normalizeVersion } from '../../src/domain/updates'

describe('versions (spec 006 FR-006)', () => {
  it.each([
    ['0.2.0', '0.1.1', 1],
    ['v0.1.1', '0.1.1', 0],
    ['1.0.0', '0.99.99', 1],
    ['0.10.0', '0.9.0', 1],
    ['1.0.0', '1.0.0-beta.2', 1],
    ['1.0.0-beta.2', '1.0.0-beta.11', -1],
    ['1.0.0-alpha', '1.0.0-alpha.1', -1],
    ['1.0.0-alpha.1', '1.0.0-alpha.beta', -1],
    ['1.0.0-beta', '1.0.0-alpha', 1],
    ['1.0.0+build.5', '1.0.0', 0],
  ])('%s vs %s → %i', (a, b, sign) => {
    expect(Math.sign(compareVersions(a, b)!)).toBe(sign)
    expect(Math.sign(compareVersions(b, a)!)).toBe(-sign || 0)
  })

  it('treats an invalid version as no update', () => {
    expect(compareVersions('latest', '0.1.0')).toBeNull()
    expect(compareVersions('0.1', '0.1.0')).toBeNull()
    expect(isNewer('nightly', '0.1.0')).toBe(false)
    expect(isNewer('01.0.0', '0.1.0')).toBe(false)
  })

  it('is newer only when greater', () => {
    expect(isNewer('v0.2.0', '0.1.1')).toBe(true)
    expect(isNewer('0.1.1', '0.1.1')).toBe(false)
    expect(isNewer('0.1.0', '0.1.1')).toBe(false)
  })

  it('normalises a tag', () => {
    expect(normalizeVersion(' v0.2.0 ')).toBe('0.2.0')
    expect(normalizeVersion('1.0.0-rc.1+abc')).toBe('1.0.0-rc.1')
    expect(normalizeVersion('release-2')).toBeNull()
  })
})

describe('automatic check is due (FR-004)', () => {
  const now = new Date('2026-11-18T12:00:00.000Z')
  it.each([
    [null, true],
    ['2026-11-17T12:00:00.000Z', true],
    ['2026-11-17T12:00:00.001Z', false],
    ['2026-11-18T11:00:00.000Z', false],
    ['2026-11-19T00:00:00.000Z', true], // the clock went back
    ['not a date', true],
  ])('last check %s → %s', (last, due) => {
    expect(isCheckDue(last, now)).toBe(due)
  })
})
