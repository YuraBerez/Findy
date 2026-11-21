// Spec 015 FR-032…FR-037: system notifications before next steps while Findy runs.
// Independent of Electron: index.ts gives it the clock, the steps and `show`.
import { dueReminders, formatStepTime, reminderKey, type StepRef } from '../domain/nextStep'
import type { Language } from '../domain/types'
import type { Translate } from './i18n'

/** Plan D-3: often enough for the 1-minute reminder */
export const CHECK_INTERVAL_MS = 10_000

export interface ReminderNotice {
  title: string
  body: string
  /** FR-035: the application to open on a click */
  applicationId: string
}

export interface RemindersDeps {
  listSteps(): StepRef[]
  /** FR-030 */
  enabled(): boolean
  /** The UI language and its translator, read at each check */
  translator(): { t: Translate; language: Language }
  /** FR-037: must not throw when the system blocks notifications */
  show(notice: ReminderNotice): void
  now(): Date
}

export function createReminders(deps: RemindersDeps) {
  /** Plan D-4: the reminders shown in this run */
  const shown = new Set<string>()

  const check = (): void => {
    if (!deps.enabled()) return
    const due = dueReminders(deps.listSteps(), deps.now())
    if (due.length === 0) return
    const { t, language } = deps.translator()
    // FR-033: once per step date, time and lead
    for (const reminder of due) {
      const key = reminderKey(reminder)
      if (shown.has(key)) continue
      shown.add(key)
      const { ref, lead } = reminder
      // FR-036: the step text, the job title and the company; never the notes
      deps.show({
        title: t('reminders.stepTitle', { count: lead / 60_000, text: ref.nextStep.text }),
        body: t('reminders.step', {
          title: ref.title,
          company: ref.company,
          time: formatStepTime(ref.nextStep.time!, language),
        }),
        applicationId: ref.id,
      })
    }
  }

  return {
    check,
    /** Checks now and then every 10 seconds; returns the stop function */
    start(): () => void {
      check()
      const timer = setInterval(check, CHECK_INTERVAL_MS)
      return () => clearInterval(timer)
    },
  }
}

export type Reminders = ReturnType<typeof createReminders>
