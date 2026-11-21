// Spec 015 FR-031…FR-034: which steps the notifications are about.
import { stepStatus } from './status'
import { stepStart, type StepRef } from './types'

const MINUTE_MS = 60 * 1000

/** FR-032, D-7: reminders 15 minutes and 1 minute before a step that has a time */
export const REMINDER_LEADS_MS = [15 * MINUTE_MS, 1 * MINUTE_MS] as const

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

export interface DueReminder {
  ref: StepRef
  /** The lead time that is due, one of `REMINDER_LEADS_MS` */
  lead: number
  /** Whole minutes until the step, rounded up: "in 5 min" after a late start */
  minutes: number
}

/** FR-033: one reminder per step date, time and lead; a changed date or time is new */
export function reminderKey({ ref, lead }: Pick<DueReminder, 'ref' | 'lead'>): string {
  return `${ref.id}|${ref.nextStep.date}|${ref.nextStep.time ?? ''}|${lead}`
}

/**
 * FR-032: for each step with a time that has not started, the shortest lead time that has
 * come. A start or a wake from sleep 5 minutes before the step gives the 15-minute
 * reminder at once; 30 seconds before it gives only the 1-minute one. After the step
 * time, nothing.
 */
export function dueReminders(refs: readonly StepRef[], now: Date): DueReminder[] {
  return refs.flatMap((ref) => {
    if (!counts(ref) || ref.nextStep.time === null) return []
    const left = stepStart(ref.nextStep).getTime() - now.getTime()
    if (left <= 0) return []
    const due = REMINDER_LEADS_MS.filter((lead) => left <= lead)
    const lead = due.at(-1)
    return lead === undefined ? [] : [{ ref, lead, minutes: Math.ceil(left / MINUTE_MS) }]
  })
}
