// Spec 015 NFR-001: dates and times of a step in the language of the user, through Intl.
import { isStepDate, isStepTime, stepStart, type NextStep } from './types'

/** "3:00 PM" / "15:00" */
export function formatStepTime(time: string, language: string): string {
  return new Intl.DateTimeFormat(language, { hour: 'numeric', minute: '2-digit' }).format(
    stepStart({ date: '2000-01-01', time }),
  )
}

/**
 * The full date with the year, and the time if set: "Nov 26, 2026, 3:00 PM" /
 * "26 лист. 2026 р., 15:00". With `weekday`, the short weekday first.
 */
export function formatStepWhen(
  step: NextStep,
  language: string,
  { weekday = false }: { weekday?: boolean } = {},
): string {
  const time = step.time === null ? {} : ({ hour: 'numeric', minute: '2-digit' } as const)
  return new Intl.DateTimeFormat(language, {
    ...(weekday ? { weekday: 'short' } : {}),
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...time,
  }).format(stepStart(step))
}

/** US-2.3: "Thu, Nov 26" / "чт, 26 лист."; the year only when it is not this year */
export function formatStepDay(step: NextStep, language: string, now: Date): string {
  const start = stepStart(step)
  return new Intl.DateTimeFormat(language, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(start.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  }).format(start)
}

/** FR-051: `YYYY-MM-DD`, or `YYYY-MM-DDTHH:MM` with a time; local, no offset */
export function stepDateText(step: NextStep): string {
  return step.time === null ? step.date : `${step.date}T${step.time}`
}

const DATE_TEXT = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}))?$/

/** FR-052: the date text of a CSV cell, or null when it is not a valid one */
export function parseStepDateText(text: string): Pick<NextStep, 'date' | 'time'> | null {
  const match = DATE_TEXT.exec(text.trim())
  if (!match || !isStepDate(match[1])) return null
  const time = match[2] ?? null
  if (time !== null && !isStepTime(time)) return null
  return { date: match[1]!, time }
}
