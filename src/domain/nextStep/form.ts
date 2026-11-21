// Spec 015 FR-010, FR-011, US-1.3: the step form in the details panel. The same rules run
// again in main (domain/schema.ts); here they map to messages next to each field.
import type { FieldError } from '../forms'
import { LIMITS } from '../limits'
import { isStepDate, isStepTime, stepTextProblem, type NextStep } from './types'

export interface NextStepFormValues {
  text: string
  /** `YYYY-MM-DD` from the date input; '' = not set */
  date: string
  /** `HH:MM` from the time input; '' = no time */
  time: string
}

export type NextStepFormErrors = Partial<Record<keyof NextStepFormValues, FieldError>>

/** The fields in the order of the form, for the focus after a failed save */
export const NEXT_STEP_FORM_ORDER = ['text', 'date', 'time'] as const

export function nextStepFormValuesOf(step: NextStep | null): NextStepFormValues {
  return { text: step?.text ?? '', date: step?.date ?? '', time: step?.time ?? '' }
}

export function validateNextStepForm(
  values: NextStepFormValues,
): { ok: true; data: NextStep } | { ok: false; errors: NextStepFormErrors } {
  const errors: NextStepFormErrors = {}
  const problem = stepTextProblem(values.text)
  if (problem === 'tooLong') errors.text = { code: 'tooLong', max: LIMITS.nextStep }
  else if (problem === 'required') errors.text = { code: 'required' }
  // A text input holds one line; a pasted line break counts as a space
  const text = values.text.trim().replace(/\s*[\r\n]+\s*/g, ' ')

  // FR-011: a date in the past is allowed
  const date = values.date.trim()
  if (!date) errors.date = { code: 'required' }
  else if (!isStepDate(date)) errors.date = { code: 'invalidDate' }

  const time = values.time.trim()
  if (time && !isStepTime(time)) errors.time = { code: 'invalidTime' }

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return { ok: true, data: { text, date, time: time || null } }
}
