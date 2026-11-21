import type { AnalyticsGrouping } from '@domain/analytics'
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

/** Spec 005: the label of a chart bucket. `short` for the axis, `long` for captions and tables. */
export function formatBucket(
  start: Date,
  grouping: AnalyticsGrouping,
  language: string,
  variant: 'short' | 'long',
): string {
  if (grouping === 'month') {
    return new Intl.DateTimeFormat(language, {
      month: variant === 'short' ? 'short' : 'long',
      year: 'numeric',
    }).format(start)
  }
  const options: Intl.DateTimeFormatOptions =
    variant === 'short'
      ? { day: 'numeric', month: 'short' }
      : { day: 'numeric', month: 'long', year: 'numeric' }
  const format = new Intl.DateTimeFormat(language, options)
  if (grouping === 'day' || variant === 'short') return format.format(start)
  // A week: "16–22 November 2026"
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6)
  return format.formatRange(start, end)
}

/** "25 %" / "2,5 %" */
export function formatShare(share: number, language: string): string {
  return new Intl.NumberFormat(language, { style: 'percent', maximumFractionDigits: 1 }).format(
    share,
  )
}

/**
 * Spec 014 FR-031: an amount or a range in the currency, whole units, digit groups of the
 * language. A range uses the en dash of `formatRange`.
 */
export function formatMoney(
  amounts: { min: number | null; max: number | null },
  currency: string,
  language: string,
): string {
  const format = new Intl.NumberFormat(language, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0,
  })
  const { min, max } = amounts
  if (min !== null && max !== null)
    return min === max ? format.format(min) : format.formatRange(min, max)
  return format.format((min ?? max)!)
}
