// Field-level validation for the application form (FR-010, FR-011).
// The same rules run again in main (domain/schema.ts); this layer only maps
// them to messages next to each field.
import { isHttpUrl, LIMITS } from './limits'
import { DEFAULT_STAGE, type StageId } from './stages'

export interface ApplicationFormValues {
  title: string
  company: string
  url: string
  stage: StageId
}

export type FieldError =
  { code: 'required' } | { code: 'tooLong'; max: number } | { code: 'invalidUrl' }

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
