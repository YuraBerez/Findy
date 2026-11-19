// Spec 010: an application that stays in its stage too long ("stale").
import type { StageId } from './stages'
import { enteredStageAt } from './time'
import type { Application } from './types'

/** FR-008: N, the days after which an application is stale */
export const STALE_DAYS = { min: 3, max: 90, default: 14 } as const

/** D-3: nothing to wait for in a final stage */
export const FINAL_STAGES: readonly StageId[] = ['offered', 'rejected']

const DAY_MS = 24 * 60 * 60 * 1000

export function isStaleAfterDays(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= STALE_DAYS.min &&
    value <= STALE_DAYS.max
  )
}

/**
 * FR-001, FR-002: whole days since the application entered its stage, when that is more
 * than `afterDays` and the stage is not final; else `null`. Only a stage change resets
 * it, because it counts from the last stage change. A clock that went back gives 0.
 */
export function staleDays(application: Application, afterDays: number, now: Date): number | null {
  if (FINAL_STAGES.includes(application.stage)) return null
  const days = Math.floor(
    Math.max(0, now.getTime() - Date.parse(enteredStageAt(application))) / DAY_MS,
  )
  return days > afterDays ? days : null
}
