// Spec 015 FR-031…FR-037: system notifications about next steps while Findy runs.
// Independent of Electron: index.ts gives it the clock, the steps and `show`.
import {
  dateKey,
  dueCount,
  dueReminders,
  formatStepTime,
  reminderKey,
  type StepRef,
} from '../domain/nextStep'
import type { Language } from '../domain/types'
import type { Translate } from './i18n'

/** Plan D-3: often enough for a 15-minute reminder, and it catches a wake from sleep */
export const CHECK_INTERVAL_MS = 30_000

export interface ReminderNotice {
  title: string
  body: string
  /** FR-035: the application to open on a click; null for the summary */
  applicationId: string | null
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
  let day: string | null = null

  const check = (): void => {
    const now = deps.now()
    const today = dateKey(now)
    // FR-031: at start, and when the local date changes while Findy runs
    const newDay = day !== today
    day = today
    if (!deps.enabled()) return
    const refs = deps.listSteps()
    const { t, language } = deps.translator()

    const count = newDay ? dueCount(refs, now) : 0
    if (count > 0)
      deps.show({
        title: t('reminders.summaryTitle'),
        body: t('reminders.summary', { count }),
        applicationId: null,
      })

    // FR-032, FR-033: once per step date and time
    for (const ref of dueReminders(refs, now)) {
      const key = reminderKey(ref)
      if (shown.has(key)) continue
      shown.add(key)
      // FR-036: the step text, the job title and the company; never the notes
      deps.show({
        title: ref.nextStep.text,
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
    /** Checks now and then every 30 seconds; returns the stop function */
    start(): () => void {
      check()
      const timer = setInterval(check, CHECK_INTERVAL_MS)
      return () => clearInterval(timer)
    },
  }
}

export type Reminders = ReturnType<typeof createReminders>
