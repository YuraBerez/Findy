// Spec 014 FR-010…FR-013: the extra fields in the details form. The same rules run
// again in main (domain/schema.ts); here they map to messages next to each field.
import type { FieldError } from '../forms'
import { LIMITS } from '../limits'
import { isKnownSiteId } from '../sites'
import type { Application } from '../types'
import { parseAmount } from './salary'
import {
  isSourceChannel,
  type ApplicationFields,
  type ApplicationSource,
  type Currency,
  type SalaryPeriod,
  type WorkFormat,
} from './types'

export interface FieldsFormValues {
  salaryMin: string
  salaryMax: string
  currency: Currency
  period: SalaryPeriod
  /** '' = not set */
  workFormat: WorkFormat | ''
  location: string
  /** `sourceKey` of the source; '' = not set */
  source: string
  contactName: string
  contactDetails: string
}

export type FieldsFormErrors = Partial<
  Record<'salaryMin' | 'salaryMax' | 'location' | 'contactName' | 'contactDetails', FieldError>
>

/** The fields in the order of the form, for the focus after a failed save */
export const FIELDS_FORM_ORDER = [
  'salaryMin',
  'salaryMax',
  'location',
  'contactName',
  'contactDetails',
] as const

/** One select value per source: `site:<id>`, `custom:<name>`, `channel:<id>` */
export function sourceKey(source: ApplicationSource | null): string {
  if (!source) return ''
  return `${source.kind}:${source.kind === 'custom' ? source.name : source.id}`
}

export function sourceOfKey(key: string): ApplicationSource | null {
  const at = key.indexOf(':')
  const kind = key.slice(0, at)
  const value = key.slice(at + 1)
  if (kind === 'site' && isKnownSiteId(value)) return { kind, id: value }
  if (kind === 'channel' && isSourceChannel(value)) return { kind, id: value }
  if (kind === 'custom' && value) return { kind, name: value }
  return null
}

/** FR-012: the currency of the last application that the user gave a salary, else USD */
export function lastCurrency(applications: readonly Application[]): Currency {
  let last: Application | undefined
  for (const application of applications)
    if (application.salary && (!last || application.updatedAt > last.updatedAt)) last = application
  return last?.salary?.currency ?? 'USD'
}

export function fieldsFormValuesOf(
  fields: ApplicationFields,
  defaultCurrency: Currency,
): FieldsFormValues {
  const { salary } = fields
  return {
    salaryMin: salary?.min?.toString() ?? '',
    salaryMax: salary?.max?.toString() ?? '',
    currency: salary?.currency ?? defaultCurrency,
    period: salary?.period ?? 'month',
    workFormat: fields.workFormat ?? '',
    location: fields.location ?? '',
    source: sourceKey(fields.source),
    contactName: fields.contactName ?? '',
    contactDetails: fields.contactDetails ?? '',
  }
}

function optionalText(value: string, max: number): { value: string | null; error?: FieldError } {
  const trimmed = value.trim()
  if (trimmed.length > max) return { value: null, error: { code: 'tooLong', max } }
  return { value: trimmed || null }
}

export function validateFieldsForm(
  values: FieldsFormValues,
): { ok: true; data: ApplicationFields } | { ok: false; errors: FieldsFormErrors } {
  const errors: FieldsFormErrors = {}
  const min = parseAmount(values.salaryMin)
  const max = parseAmount(values.salaryMax)
  if (min === undefined) errors.salaryMin = { code: 'invalidAmount' }
  if (max === undefined) errors.salaryMax = { code: 'invalidAmount' }
  if (typeof min === 'number' && typeof max === 'number' && min > max)
    errors.salaryMin = { code: 'salaryOrder' }

  const text = {
    location: optionalText(values.location, LIMITS.location),
    contactName: optionalText(values.contactName, LIMITS.contactName),
    contactDetails: optionalText(values.contactDetails, LIMITS.contactDetails),
  }
  for (const [field, result] of Object.entries(text))
    if (result.error) errors[field as keyof typeof text] = result.error

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  const amounts = { min: min ?? null, max: max ?? null }
  return {
    ok: true,
    data: {
      // FR-003: no amount → no currency and no period
      salary:
        amounts.min === null && amounts.max === null
          ? null
          : { ...amounts, currency: values.currency, period: values.period },
      workFormat: values.workFormat || null,
      location: text.location.value,
      source: sourceOfKey(values.source),
      contactName: text.contactName.value,
      contactDetails: text.contactDetails.value,
    },
  }
}
