import { describe, expect, it } from 'vitest'
import { applyMove, groupByStage } from '../../src/domain/board'
import {
  EMPTY_FORM,
  formValuesOf,
  validateApplicationForm,
  validateNote,
} from '../../src/domain/forms'
import { elapsed, enteredStageAt } from '../../src/domain/time'
import type { Application } from '../../src/domain/types'

describe('validateApplicationForm (US-1)', () => {
  it('returns trimmed data with url null when empty (US-1.4)', () => {
    expect(
      validateApplicationForm({ ...EMPTY_FORM, title: ' Dev ', company: ' Acme ', url: '  ' }),
    ).toEqual({ ok: true, data: { title: 'Dev', company: 'Acme', url: null, stage: 'applied' } })
  })

  it('marks empty required fields (US-1.2)', () => {
    expect(validateApplicationForm({ ...EMPTY_FORM, title: '  ' })).toEqual({
      ok: false,
      errors: { title: { code: 'required' }, company: { code: 'required' } },
    })
  })

  it('rejects a non-http(s) url (US-1.3)', () => {
    const result = validateApplicationForm({
      ...EMPTY_FORM,
      title: 'a',
      company: 'b',
      url: 'acme jobs',
    })
    expect(result).toEqual({ ok: false, errors: { url: { code: 'invalidUrl' } } })
  })

  it('reports too long values with the limit', () => {
    const result = validateApplicationForm({
      ...EMPTY_FORM,
      title: 'x'.repeat(201),
      company: 'b',
      url: `https://a.com/${'x'.repeat(2048)}`,
    })
    expect(result).toEqual({
      ok: false,
      errors: { title: { code: 'tooLong', max: 200 }, url: { code: 'tooLong', max: 2048 } },
    })
  })

  it('keeps the chosen stage (US-1.5)', () => {
    const result = validateApplicationForm({ title: 'a', company: 'b', url: '', stage: 'offered' })
    expect(result.ok && result.data.stage).toBe('offered')
  })
})

describe('elapsed (FR-003)', () => {
  const now = new Date('2026-11-17T12:00:00Z')
  it.each([
    ['2026-11-17T12:00:30Z', 0, 'minute'],
    ['2026-11-17T11:15:00Z', 45, 'minute'],
    ['2026-11-17T09:00:00Z', 3, 'hour'],
    ['2026-11-14T11:00:00Z', 3, 'day'],
    ['2026-11-18T12:00:00Z', 0, 'minute'],
  ])('%s → %i %s', (from, value, unit) => {
    expect(elapsed(from, now)).toEqual({ value, unit })
  })
})

const app = (id: string, stage: Application['stage'], order: number): Application => ({
  id,
  title: id,
  company: 'c',
  url: null,
  stage,
  order,
  stageHistory: [
    { stage: 'applied', at: '2026-11-10T00:00:00Z' },
    { stage, at: '2026-11-12T00:00:00Z' },
  ],
  notes: [],
  createdAt: '2026-11-10T00:00:00Z',
  updatedAt: '2026-11-12T00:00:00Z',
})

describe('board helpers', () => {
  it('groups by stage in board order and sorts each column', () => {
    const columns = groupByStage([
      app('b', 'applied', 1),
      app('x', 'offered', 0),
      app('a', 'applied', 0),
    ])
    expect(Object.keys(columns)[0]).toBe('applied')
    expect(columns.applied.map((a) => a.id)).toEqual(['a', 'b'])
    expect(columns.offered.map((a) => a.id)).toEqual(['x'])
    expect(columns.rejected).toEqual([])
  })

  it('uses the last stage change as the stage entry time', () => {
    expect(enteredStageAt(app('a', 'offered', 0))).toBe('2026-11-12T00:00:00Z')
    expect(enteredStageAt({ ...app('a', 'applied', 0), stageHistory: [] })).toBe(
      '2026-11-10T00:00:00Z',
    )
  })
})

describe('applyMove (optimistic move, FR-020…024)', () => {
  const now = '2026-11-17T10:00:00.000Z'
  const board = [app('a', 'applied', 0), app('b', 'applied', 1), app('c', 'hr_interview', 0)]

  it('moves across stages, renumbers both columns and appends history', () => {
    const result = applyMove(board, 'a', { stage: 'hr_interview', index: 1 }, now)
    const columns = groupByStage(result)
    expect(columns.applied.map((x) => [x.id, x.order])).toEqual([['b', 0]])
    expect(columns.hr_interview.map((x) => [x.id, x.order])).toEqual([
      ['c', 0],
      ['a', 1],
    ])
    const moved = result.find((x) => x.id === 'a')!
    expect(moved.stageHistory.at(-1)).toEqual({ stage: 'hr_interview', at: now })
    expect(moved.updatedAt).toBe(now)
  })

  it('reorders within a stage without new history', () => {
    const result = applyMove(board, 'b', { stage: 'applied', index: 0 }, now)
    expect(groupByStage(result).applied.map((x) => x.id)).toEqual(['b', 'a'])
    expect(result.find((x) => x.id === 'b')!.stageHistory).toHaveLength(2)
  })

  it('clamps the index and ignores unknown ids', () => {
    const result = applyMove(board, 'c', { stage: 'applied', index: 99 }, now)
    expect(groupByStage(result).applied.map((x) => x.id)).toEqual(['a', 'b', 'c'])
    expect(applyMove(board, 'zzz', { stage: 'offered', index: 0 }, now)).toBe(board)
  })
})

describe('editing and notes', () => {
  it('fills the form from an application (FR-012)', () => {
    expect(formValuesOf({ ...app('a', 'offered', 0), url: null })).toEqual({
      title: 'a',
      company: 'c',
      url: '',
      stage: 'offered',
    })
    expect(formValuesOf({ ...app('a', 'applied', 0), url: 'https://x.com' }).url).toBe(
      'https://x.com',
    )
  })

  it('validates note text (FR-030)', () => {
    expect(validateNote('  call back  ')).toBeNull()
    expect(validateNote('   ')).toEqual({ code: 'required' })
    expect(validateNote('x'.repeat(10_001))).toEqual({ code: 'tooLong', max: 10_000 })
  })
})
