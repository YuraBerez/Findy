// Spec 011 FR-010, FR-013: rules of a site the user adds. The same rules run in main
// (domain/schema.ts); here they map to messages next to each field.
import type { FieldError } from '../forms'
import { isHttpUrl, LIMITS } from '../limits'
import { QUERY_PLACEHOLDER } from './url'

export const SITE_LIMITS = { name: 60, url: LIMITS.url, count: 50, query: 200 } as const

export interface SiteFormValues {
  name: string
  url: string
}

export type SiteFormErrors = Partial<Record<keyof SiteFormValues, FieldError>>

/** A marker for `{query}` that a URL parser keeps as is */
const MARKER = 'findyquerymarker'

/** FR-010: `http`/`https`, and `{query}` at most once, not in the host. */
export function siteUrlError(url: string): FieldError | undefined {
  if (!url) return { code: 'required' }
  if (url.length > SITE_LIMITS.url) return { code: 'tooLong', max: SITE_LIMITS.url }
  const parts = url.split(QUERY_PLACEHOLDER)
  if (parts.length > 2) return { code: 'queryPlacement' }
  const filled = parts.join(MARKER)
  if (!isHttpUrl(filled)) return { code: 'invalidUrl' }
  if (new URL(filled).host.includes(MARKER)) return { code: 'queryPlacement' }
  return undefined
}

export function validateSiteForm(
  values: SiteFormValues,
): { ok: true; data: SiteFormValues } | { ok: false; errors: SiteFormErrors } {
  const name = values.name.trim()
  const url = values.url.trim()
  const errors: SiteFormErrors = {}
  if (!name) errors.name = { code: 'required' }
  else if (Array.from(name).length > SITE_LIMITS.name)
    errors.name = { code: 'tooLong', max: SITE_LIMITS.name }
  const urlError = siteUrlError(url)
  if (urlError) errors.url = urlError
  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, data: { name, url } }
}
