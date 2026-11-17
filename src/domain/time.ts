import type { Application } from './types'

export type ElapsedUnit = 'minute' | 'hour' | 'day'

/** Whole units elapsed between `from` and `now`, in the largest unit that fits. */
export function elapsed(from: string, now: Date): { value: number; unit: ElapsedUnit } {
  const minutes = Math.max(0, Math.floor((now.getTime() - Date.parse(from)) / 60_000))
  if (minutes < 60) return { value: minutes, unit: 'minute' }
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return { value: hours, unit: 'hour' }
  return { value: Math.floor(hours / 24), unit: 'day' }
}

/** FR-003: when the application entered its current stage. */
export function enteredStageAt(application: Application): string {
  return application.stageHistory.at(-1)?.at ?? application.createdAt
}
