// Spec 015 FR-040, FR-041: one step as an iCalendar (RFC 5545) event, and its file name.
import { addDays, type NextStep } from './types'

/** FR-041: a step with a time lasts one hour */
const EVENT_MINUTES = 60

export interface CalendarApplication {
  id: string
  title: string
  company: string
  url: string | null
}

/** RFC 5545 §3.3.11: backslash, semicolon, comma and line breaks are escaped */
function escapeText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n')
}

/** RFC 5545 §3.1: lines of at most 75 octets; a continuation starts with a space */
function fold(line: string): string {
  const encoder = new TextEncoder()
  const parts: string[] = []
  let current = ''
  for (const char of line) {
    const limit = parts.length === 0 ? 75 : 74
    if (encoder.encode(current + char).length > limit) {
      parts.push(current)
      current = char
    } else current += char
  }
  parts.push(current)
  return parts.join('\r\n ')
}

const compactDate = (date: string) => date.replace(/-/g, '')
const pad = (value: number) => String(value).padStart(2, '0')

/** Plan D-5: a floating local time, `YYYYMMDDTHHMMSS` without a zone */
function localDateTime(date: string, time: string, plusMinutes = 0): string {
  const [hours, minutes] = time.split(':').map(Number) as [number, number]
  const total = hours * 60 + minutes + plusMinutes
  const day = addDays(date, Math.floor(total / (24 * 60)))
  const inDay = total % (24 * 60)
  return `${compactDate(day)}T${pad(Math.floor(inDay / 60))}${pad(inDay % 60)}00`
}

/** `20261121T083000Z` */
function utcStamp(moment: Date): string {
  return moment
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
}

/**
 * US-5: the title is the step text and the company; the description has the job title
 * and the vacancy link. Without a time the event is an all-day event.
 */
export function calendarEvent(
  application: CalendarApplication,
  step: NextStep,
  stamp: Date,
): string {
  const timing =
    step.time === null
      ? [
          `DTSTART;VALUE=DATE:${compactDate(step.date)}`,
          `DTEND;VALUE=DATE:${compactDate(addDays(step.date, 1))}`,
        ]
      : [
          `DTSTART:${localDateTime(step.date, step.time)}`,
          `DTEND:${localDateTime(step.date, step.time, EVENT_MINUTES)}`,
        ]
  const description = [application.title, application.url].filter(Boolean).join('\n')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Findy//Findy//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${application.id}-${compactDate(step.date)}@findy`,
    `DTSTAMP:${utcStamp(stamp)}`,
    ...timing,
    `SUMMARY:${escapeText(`${step.text} — ${application.company}`)}`,
    `DESCRIPTION:${escapeText(description)}`,
    ...(application.url ? [`URL:${application.url}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.map(fold).join('\r\n') + '\r\n'
}

/** FR-040: `findy-<company>-<YYYY-MM-DD>.ics` without characters that file names forbid */
export function calendarFileName(company: string, date: string): string {
  const name = company
    // eslint-disable-next-line no-control-regex -- control characters are not allowed
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/^\.+|\.+$/g, '')
  return name ? `findy-${name}-${date}.ics` : `findy-${date}.ics`
}
