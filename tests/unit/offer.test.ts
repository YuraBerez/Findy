import { describe, expect, it } from 'vitest'
import { asksAboutOffer } from '../../src/domain/offer'

describe('asksAboutOffer (spec 013 FR-001, FR-002)', () => {
  it('asks after a move from another stage to Offer', () => {
    expect(asksAboutOffer('applied', 'offered', false)).toBe(true)
    expect(asksAboutOffer('rejected', 'offered', false)).toBe(true)
  })

  it('does not ask for a reorder inside Offer', () => {
    expect(asksAboutOffer('offered', 'offered', false)).toBe(false)
  })

  it('does not ask for a move to another stage', () => {
    expect(asksAboutOffer('applied', 'hr_interview', false)).toBe(false)
    expect(asksAboutOffer('offered', 'rejected', false)).toBe(false)
  })

  it('never asks after a final answer (FR-004)', () => {
    expect(asksAboutOffer('applied', 'offered', true)).toBe(false)
  })
})
