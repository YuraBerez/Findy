// Spec 015 FR-032…FR-034: which steps the notifications are about.
import { stepStart, type StepRef } from './types'

const MINUTE_MS = 60 * 1000

/** FR-032, D-7: reminders 15 minutes and 1 minute before a step that has a time */
export const REMINDER_LEADS_MS = [15 * MINUTE_MS, 1 * MINUTE_MS] as const

/** How late a reminder may still come: a check runs every few seconds, not exactly on time */
const LATE_MS = MINUTE_MS

export interface DueReminder {
  ref: StepRef
  /** One of `REMINDER_LEADS_MS` */
  lead: number
}

/** FR-033: one reminder per step date, time and lead; a changed date or time is new */
export function reminderKey({ ref, lead }: DueReminder): string {
  return `${ref.id}|${ref.nextStep.date}|${ref.nextStep.time ?? ''}|${lead}`
}

/**
 * FR-032, D-7: the reminders whose moment came less than a minute ago. Findy shows only
 * "in 15 min" and "in 1 min": a step that is 3 minutes away after a start or a wake from
 * sleep gets no reminder until 1 minute before. FR-034: never for Rejected.
 */
export function dueReminders(refs: readonly StepRef[], now: Date): DueReminder[] {
  return refs.flatMap((ref) => {
    if (ref.stage === 'rejected' || ref.nextStep.time === null) return []
    const left = stepStart(ref.nextStep).getTime() - now.getTime()
    return REMINDER_LEADS_MS.filter(
      (lead) => left > 0 && left <= lead && left > lead - LATE_MS,
    ).map((lead) => ({ ref, lead }))
  })
}
