import { elapsed } from '@domain/time'

/** "3 days ago" / "3 дні тому" (FR-003, FR-043). */
export function formatSince(iso: string, language: string, now = new Date()): string {
  const { value, unit } = elapsed(iso, now)
  return new Intl.RelativeTimeFormat(language, { numeric: 'auto' }).format(-value, unit)
}

/** Locale date and time for tooltips and details (FR-043). */
export function formatDateTime(iso: string, language: string): string {
  return new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  )
}
