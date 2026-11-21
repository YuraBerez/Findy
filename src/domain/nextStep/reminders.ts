// Spec 015 FR-031…FR-034: which steps the notifications are about.
import { stepStatus } from './status'
import { stepStart, type StepRef } from './types'

/** FR-032: the notification comes this long before a step that has a time */
export const REMINDER_LEAD_MS = 15 * 60 * 1000

/** FR-034: steps in Rejected never count; hidden columns do */
const counts = (ref: StepRef) => ref.stage !== 'rejected'

/** FR-031: steps for today or overdue */
export function dueCount(refs: readonly StepRef[], now: Date): number {
  return refs.filter((ref) => {
    if (!counts(ref)) return false
    const status = stepStatus(ref.nextStep, now)
    return status === 'today' || status === 'overdue'
  }).length
}

/** FR-033: one reminder per step date and time; a change gives a new key */
export function reminderKey(ref: StepRef): string {
  return `${ref.id}|${ref.nextStep.date}|${ref.nextStep.time ?? ''}`
}

/**
 * FR-032: steps with a time that starts in 15 minutes or less, and not yet. After a wake
 * from sleep inside that window the step is still due; after its time it is not.
 */
export function dueReminders(refs: readonly StepRef[], now: Date): StepRef[] {
  return refs.filter((ref) => {
    if (!counts(ref) || ref.nextStep.time === null) return false
    const start = stepStart(ref.nextStep).getTime()
    return now.getTime() >= start - REMINDER_LEAD_MS && now.getTime() < start
  })
}
