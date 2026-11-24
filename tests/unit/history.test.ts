import { describe, expect, it } from 'vitest'
import { removeStageChange } from '../../src/domain/history'
import type { StageId } from '../../src/domain/stages'

const history = (...stages: StageId[]) => stages.map((stage, day) => ({ stage, day }))

describe('removeStageChange (spec 021)', () => {
  it('removes a middle entry (US-1.1)', () => {
    expect(removeStageChange(history('applied', 'technical_interview', 'hr_interview'), 1)).toEqual(
      [
        { stage: 'applied', day: 0 },
        { stage: 'hr_interview', day: 2 },
      ],
    )
  })

  it('removes the first and the last entry', () => {
    expect(removeStageChange(history('applied', 'hr_interview'), 0)).toEqual([
      { stage: 'hr_interview', day: 1 },
    ])
    expect(removeStageChange(history('applied', 'hr_interview', 'offered'), 2)).toEqual([
      { stage: 'applied', day: 0 },
      { stage: 'hr_interview', day: 1 },
    ])
  })

  it('merges equal neighbours into the earlier entry (FR-004, US-3.1)', () => {
    expect(
      removeStageChange(history('applied', 'hr_interview', 'applied', 'test_task'), 1),
    ).toEqual([
      { stage: 'applied', day: 0 },
      { stage: 'test_task', day: 3 },
    ])
  })

  it('merges every run of equal stages, also ones that were there before', () => {
    expect(removeStageChange(history('applied', 'applied', 'hr_interview', 'applied'), 2)).toEqual([
      { stage: 'applied', day: 0 },
    ])
  })

  it('keeps the only entry and rejects an index out of range (FR-002)', () => {
    expect(removeStageChange(history('applied'), 0)).toBeNull()
    expect(removeStageChange(history('applied', 'hr_interview'), 2)).toBeNull()
    expect(removeStageChange(history('applied', 'hr_interview'), -1)).toBeNull()
    expect(removeStageChange(history('applied', 'hr_interview'), 0.5)).toBeNull()
  })
})
