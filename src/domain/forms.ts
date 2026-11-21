// Field-level validation for the application form (FR-010, FR-011).
// The same rules run again in main (domain/schema.ts); this layer only maps
// them to messages next to each field.
import { isHttpUrl, LIMITS } from './limits'
import { DEFAULT_STAGE, type StageId } from './stages'
import type { Application } from './types'

export interface ApplicationFormValues {
  title: string
  company: string
  url: string
  stage: StageId
}

export type FieldError =
  | { code: 'required' }
  | { code: 'tooLong'; max: number }
  | { code: 'invalidUrl' }
  /** Spec 011 FR-010: `{query}` twice, or in the host */
  | { code: 'queryPlacement' }
  /** Spec 014 FR-013: not a whole number 0…1 000 000 000 */
  | { code: 'invalidAmount' }
  /** Spec 014 FR-002: "from" is larger than "to" */
  | { code: 'salaryOrder' }
  /** Spec 015 US-1.3: not a calendar date, or not a time of day */
  | { code: 'invalidDate' }
  | { code: 'invalidTime' }

export type FormErrors = Partial<Record<'title' | 'company' | 'url', FieldError>>

export interface ValidApplication {
  title: string
  company: string
  url: string | null
  stage: StageId
}

export const EMPTY_FORM: ApplicationFormValues = {
  title: '',
  company: '',
  url: '',
  stage: DEFAULT_STAGE,
}

function requiredText(value: string, max: number): FieldError | undefined {
  const trimmed = value.trim()
  if (!trimmed) return { code: 'required' }
  if (trimmed.length > max) return { code: 'tooLong', max }
  return undefined
}

export function validateApplicationForm(
  values: ApplicationFormValues,
): { ok: true; data: ValidApplication } | { ok: false; errors: FormErrors } {
  const url = values.url.trim()
  const errors: FormErrors = {}
  const title = requiredText(values.title, LIMITS.title)
  const company = requiredText(values.company, LIMITS.company)
  if (title) errors.title = title
  if (company) errors.company = company
  if (url.length > LIMITS.url) errors.url = { code: 'tooLong', max: LIMITS.url }
  else if (url && !isHttpUrl(url)) errors.url = { code: 'invalidUrl' }

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return {
    ok: true,
    data: {
      title: values.title.trim(),
      company: values.company.trim(),
      url: url || null,
      stage: values.stage,
    },
  }
}

/** The form filled with an existing application, for editing (FR-012). */
export function formValuesOf(application: Application): ApplicationFormValues {
  return {
    title: application.title,
    company: application.company,
    url: application.url ?? '',
    stage: application.stage,
  }
}

/** FR-030: a note is 1–10 000 characters after trimming. `null` means valid. */
export function validateNote(text: string): FieldError | null {
  return requiredText(text, LIMITS.note) ?? null
}
