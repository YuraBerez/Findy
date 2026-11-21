// Spec 015 FR-001, FR-002: the next step of an application, in local wall-clock time.
import { LIMITS } from '../limits'
import type { StageId } from '../stages'

export interface NextStep {
  /** Trimmed, 1–200 characters, one line */
  text: string
  /** Local calendar date `YYYY-MM-DD` */
  date: string
  /** Local time `HH:MM`; `null` = no time (all day) */
  time: string | null
}

/** What the reminders and the marks need of an application with a step */
export interface StepRef {
  id: string
  title: string
  company: string
  stage: StageId
  nextStep: NextStep
}

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/

/** A real calendar date: `2026-02-29` is not one */
export function isStepDate(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const match = DATE.exec(value)
  if (!match) return false
  const [year, month, day] = match.slice(1).map(Number) as [number, number, number]
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

export function isStepTime(value: unknown): value is string {
  return typeof value === 'string' && TIME.test(value)
}

/** Trimmed text of a step, or the problem with it */
export function stepTextProblem(text: string): 'required' | 'tooLong' | 'oneLine' | null {
  const trimmed = text.trim()
  if (!trimmed) return 'required'
  if (trimmed.length > LIMITS.nextStep) return 'tooLong'
  if (/[\r\n]/.test(trimmed)) return 'oneLine'
  return null
}

export function isNextStep(value: {
  text: string
  date: string
  time: string | null
}): value is NextStep {
  return (
    stepTextProblem(value.text) === null &&
    value.text === value.text.trim() &&
    isStepDate(value.date) &&
    (value.time === null || isStepTime(value.time))
  )
}

const pad = (value: number) => String(value).padStart(2, '0')

/** The local calendar date of a moment, `YYYY-MM-DD` */
export function dateKey(moment: Date): string {
  return `${moment.getFullYear()}-${pad(moment.getMonth() + 1)}-${pad(moment.getDate())}`
}

/** The local date `days` after `date` */
export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number]
  return dateKey(new Date(year, month - 1, day + days))
}

/**
 * FR-002: the moment of the step in the current time zone; the start of the day without a
 * time. A time that a daylight saving change skips becomes the next valid moment.
 */
export function stepStart(step: Pick<NextStep, 'date' | 'time'>): Date {
  const [year, month, day] = step.date.split('-').map(Number) as [number, number, number]
  const [hours, minutes] = (step.time ?? '00:00').split(':').map(Number) as [number, number]
  return new Date(year, month - 1, day, hours, minutes)
}
