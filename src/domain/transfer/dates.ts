/** Minutes east of UTC at that moment; the local time zone by default */
export type OffsetOf = (date: Date) => number

export const localOffset: OffsetOf = (date) => -date.getTimezoneOffset()

const pad = (value: number) => String(value).padStart(2, '0')

/** FR-005: `2026-11-18T10:30:00+02:00`, to the second, with the local offset. */
export function formatDate(iso: string, offsetOf: OffsetOf = localOffset): string {
  const date = new Date(iso)
  const offset = offsetOf(date)
  const local = new Date(date.getTime() + offset * 60_000)
  const sign = offset < 0 ? '-' : '+'
  const abs = Math.abs(offset)
  return local.toISOString().slice(0, 19) + `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:?\d{2})?)?$/

/** FR-013: an ISO 8601 date or date-time as a UTC timestamp, or null. */
export function parseDate(value: string): string | null {
  const text = value.trim()
  if (!ISO_DATE.test(text)) return null
  const time = Date.parse(text)
  return Number.isNaN(time) ? null : new Date(time).toISOString()
}
