// Spec 013: congratulate on an offer and ask once if Findy helped.
import type { StageId } from './stages'

export const OFFER_STAGE: StageId = 'offered'

/** FR-010: a move from another stage to Offer; a reorder inside Offer is not one */
export function isMoveToOffer(from: StageId, to: StageId): boolean {
  return from !== OFFER_STAGE && to === OFFER_STAGE
}

/**
 * FR-001, FR-002: a move the user made in the app opens the offer dialog when it goes
 * from another stage to Offer and the question has no final answer yet. A reorder
 * inside the Offer column does not count.
 */
export function asksAboutOffer(from: StageId, to: StageId, answered: boolean): boolean {
  return !answered && isMoveToOffer(from, to)
}
