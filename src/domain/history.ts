import type { StageId } from './stages'

/**
 * Spec 021 FR-002, FR-004: the history without the entry at `index`; equal neighbours
 * then merge into the earlier one. The only entry stays: `null` when it cannot go.
 * Generic so that main can keep its row ids.
 */
export function removeStageChange<T extends { stage: StageId }>(
  history: readonly T[],
  index: number,
): T[] | null {
  if (history.length < 2 || !Number.isInteger(index) || index < 0 || index >= history.length)
    return null
  const kept: T[] = []
  for (const [position, change] of history.entries()) {
    if (position !== index && kept.at(-1)?.stage !== change.stage) kept.push(change)
  }
  return kept
}
