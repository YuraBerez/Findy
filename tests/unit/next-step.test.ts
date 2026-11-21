// Spec 015: rules of the next step, its status, reminders, formats and calendar file.
// Moments are built with the local constructor, so the tests pass in any time zone.
import { describe, expect, it } from 'vitest'
import {
  addDays,
  calendarEvent,
  calendarFileName,
  dateKey,
  dueReminders,
  formatStepDay,
  formatStepTime,
  formatStepWhen,
  isNextStep,
  isStepDate,
  isStepTime,
  nextStatusChange,
  nextStepFormValuesOf,
  parseStepDateText,
  reminderKey,
  REMINDER_LEADS_MS,
  showsStepMark,
  stepDateText,
  stepStart,
  stepStatus,
  stepTextProblem,
  validateNextStepForm,
  type NextStep,
  type StepRef,
} from '../../src/domain/nextStep'
import { ApplicationPatchSchema, NextStepSchema } from '../../src/domain/schema'

const step = (date: string, time: string | null = null, text = 'Call Olena'): NextStep => ({
  text,
  date,
  time,
})

/** Saturday 21 Nov 2026, 14:00 local time */
const NOW = new Date(2026, 10, 21, 14, 0)

describe('step values (FR-001, FR-002)', () => {
  it('accepts real calendar dates only', () => {
    expect(isStepDate('2026-11-26')).toBe(true)
    expect(isStepDate('2028-02-29')).toBe(true)
    expect(isStepDate('2026-02-29')).toBe(false)
    expect(isStepDate('2026-13-01')).toBe(false)
    expect(isStepDate('26.11.2026')).toBe(false)
    expect(isStepDate(20261126)).toBe(false)
  })

  it('accepts times 00:00–23:59', () => {
    expect(isStepTime('00:00')).toBe(true)
    expect(isStepTime('23:59')).toBe(true)
    expect(isStepTime('24:00')).toBe(false)
    expect(isStepTime('9:30')).toBe(false)
    expect(isStepTime(null)).toBe(false)
  })

  it('wants one line of 1–200 characters', () => {
    expect(stepTextProblem('  Call  ')).toBeNull()
    expect(stepTextProblem('   ')).toBe('required')
    expect(stepTextProblem('x'.repeat(201))).toBe('tooLong')
    expect(stepTextProblem('a\nb')).toBe('oneLine')
    expect(isNextStep(step('2026-11-26', '15:00'))).toBe(true)
    expect(isNextStep({ text: ' padded', date: '2026-11-26', time: null })).toBe(false)
    expect(isNextStep(step('2026-11-26', '25:00'))).toBe(false)
  })

  it('is local wall-clock time (FR-002)', () => {
    expect(stepStart(step('2026-11-26', '15:00'))).toEqual(new Date(2026, 10, 26, 15, 0))
    expect(stepStart(step('2026-11-26'))).toEqual(new Date(2026, 10, 26))
    expect(dateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29')
  })
})

describe('stepStatus (FR-020)', () => {
  it('is overdue before today, and today after its time', () => {
    expect(stepStatus(step('2026-11-20'), NOW)).toBe('overdue')
    expect(stepStatus(step('2026-11-21', '13:59'), NOW)).toBe('overdue')
    expect(stepStatus(step('2026-11-21', '14:00'), NOW)).toBe('overdue')
  })

  it('is today, tomorrow or later', () => {
    expect(stepStatus(step('2026-11-21'), NOW)).toBe('today')
    expect(stepStatus(step('2026-11-21', '15:00'), NOW)).toBe('today')
    expect(stepStatus(step('2026-11-22', '09:00'), NOW)).toBe('tomorrow')
    expect(stepStatus(step('2026-11-23'), NOW)).toBe('later')
  })

  it('shows no mark in Rejected (FR-020, D-5)', () => {
    expect(showsStepMark('offered', step('2026-11-21'))).toBe(true)
    expect(showsStepMark('rejected', step('2026-11-21'))).toBe(false)
    expect(showsStepMark('applied', null)).toBe(false)
  })
})

describe('nextStatusChange (FR-023)', () => {
  it('is the next local midnight without a step time today', () => {
    expect(nextStatusChange([null, step('2026-11-23', '10:00'), step('2026-11-21')], NOW)).toEqual(
      new Date(2026, 10, 22),
    )
  })

  it('is the earliest step time after now', () => {
    expect(
      nextStatusChange(
        [step('2026-11-21', '18:00'), step('2026-11-21', '15:30'), step('2026-11-21', '09:00')],
        NOW,
      ),
    ).toEqual(new Date(2026, 10, 21, 15, 30))
  })
})

describe('dueReminders (FR-032…FR-034, D-7, D-8)', () => {
  const ref = (over: Partial<StepRef> = {}, nextStep = step('2026-11-21', '14:15')): StepRef => ({
    id: 'a',
    title: 'Frontend Developer',
    company: 'Acme',
    stage: 'technical_interview',
    nextStep,
    ...over,
  })
  const at = (hours: number, minutes: number, seconds = 0) =>
    new Date(2026, 10, 21, hours, minutes, seconds)

  it('gives the 15-minute and the 1-minute reminder at their moments', () => {
    expect(REMINDER_LEADS_MS).toEqual([15 * 60_000, 60_000])
    expect(dueReminders([ref()], at(13, 59, 59))).toEqual([])
    expect(dueReminders([ref()], at(14, 0))).toEqual([{ ref: ref(), lead: 15 * 60_000 }])
    expect(dueReminders([ref()], at(14, 0, 50))).toEqual([{ ref: ref(), lead: 15 * 60_000 }])
    expect(dueReminders([ref()], at(14, 3))).toEqual([])
    expect(dueReminders([ref()], at(14, 14, 5))).toEqual([{ ref: ref(), lead: 60_000 }])
    expect(dueReminders([ref()], at(14, 15))).toEqual([])
  })

  it('skips a moment that passed more than a minute ago (D-8)', () => {
    expect(dueReminders([ref()], at(14, 1, 30))).toEqual([])
  })

  it('never for Rejected or a step without a time; hidden columns count (FR-034)', () => {
    expect(dueReminders([ref({ stage: 'rejected' })], at(14, 0))).toEqual([])
    expect(dueReminders([ref({}, step('2026-11-21'))], at(0, 0))).toEqual([])
  })

  it('has one key per date, time and lead (FR-033)', () => {
    const first = reminderKey({ ref: ref(), lead: 60_000 })
    expect(first).toBe('a|2026-11-21|14:15|60000')
    expect(reminderKey({ ref: ref(), lead: 15 * 60_000 })).not.toBe(first)
    expect(reminderKey({ ref: ref({}, step('2026-11-21', '14:30')), lead: 60_000 })).not.toBe(first)
  })
})

describe('formats (NFR-001, FR-051)', () => {
  const intl = (options: Intl.DateTimeFormatOptions, date: Date, language = 'en') =>
    new Intl.DateTimeFormat(language, options).format(date)

  it('formats times and dates through Intl', () => {
    expect(formatStepTime('15:00', 'uk')).toBe(
      intl({ hour: 'numeric', minute: '2-digit' }, new Date(2000, 0, 1, 15), 'uk'),
    )
    expect(formatStepWhen(step('2026-11-26', '15:00'), 'en')).toBe(
      intl(
        { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' },
        new Date(2026, 10, 26, 15),
      ),
    )
    expect(formatStepWhen(step('2026-11-26'), 'uk', { weekday: true })).toBe(
      intl(
        { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' },
        new Date(2026, 10, 26),
        'uk',
      ),
    )
  })

  it('gives the year of a short date only when it is not this year (US-2.3)', () => {
    expect(formatStepDay(step('2026-11-26'), 'uk', NOW)).toBe(
      intl({ weekday: 'short', day: 'numeric', month: 'short' }, new Date(2026, 10, 26), 'uk'),
    )
    expect(formatStepDay(step('2027-01-04'), 'en', NOW)).toMatch(/2027/)
  })

  it('writes and reads the CSV date text', () => {
    expect(stepDateText(step('2026-11-26'))).toBe('2026-11-26')
    expect(stepDateText(step('2026-11-26', '15:00'))).toBe('2026-11-26T15:00')
    expect(parseStepDateText(' 2026-11-26T15:00 ')).toEqual({ date: '2026-11-26', time: '15:00' })
    expect(parseStepDateText('2026-11-26')).toEqual({ date: '2026-11-26', time: null })
    expect(parseStepDateText('2026-02-30')).toBeNull()
    expect(parseStepDateText('2026-11-26T25:00')).toBeNull()
    expect(parseStepDateText('26.11.2026')).toBeNull()
  })
})

describe('step form (US-1.3, FR-011)', () => {
  it('starts from the step, or empty', () => {
    expect(nextStepFormValuesOf(null)).toEqual({ text: '', date: '', time: '' })
    expect(nextStepFormValuesOf(step('2026-11-26', '15:00'))).toEqual({
      text: 'Call Olena',
      date: '2026-11-26',
      time: '15:00',
    })
  })

  it('needs text and a date; a past date is allowed', () => {
    expect(validateNextStepForm({ text: ' ', date: '', time: '' })).toEqual({
      ok: false,
      errors: { text: { code: 'required' }, date: { code: 'required' } },
    })
    expect(validateNextStepForm({ text: ' Call\nOlena ', date: '2020-01-01', time: '' })).toEqual({
      ok: true,
      data: { text: 'Call Olena', date: '2020-01-01', time: null },
    })
  })

  it('reports a long text, a bad date and a bad time', () => {
    expect(
      validateNextStepForm({ text: 'x'.repeat(201), date: '2026-02-30', time: '25:00' }),
    ).toEqual({
      ok: false,
      errors: {
        text: { code: 'tooLong', max: 200 },
        date: { code: 'invalidDate' },
        time: { code: 'invalidTime' },
      },
    })
  })
})

describe('NextStepSchema (FR-001, FR-054)', () => {
  it('trims the text and makes a missing time null', () => {
    expect(NextStepSchema.parse({ text: ' Call ', date: '2026-11-26' })).toEqual({
      text: 'Call',
      date: '2026-11-26',
      time: null,
    })
  })

  it('rejects two lines, a bad date and a bad time', () => {
    expect(NextStepSchema.safeParse({ text: 'a\nb', date: '2026-11-26' }).success).toBe(false)
    expect(NextStepSchema.safeParse({ text: 'a', date: '2026-02-30' }).success).toBe(false)
    expect(NextStepSchema.safeParse({ text: 'a', date: '2026-11-26', time: '7:00' }).success).toBe(
      false,
    )
  })

  it('is optional and nullable in a patch', () => {
    expect(ApplicationPatchSchema.parse({}).nextStep).toBeUndefined()
    expect(ApplicationPatchSchema.parse({ nextStep: null }).nextStep).toBeNull()
  })
})

describe('calendar file (FR-040, FR-041)', () => {
  const application = {
    id: 'a1',
    title: 'Frontend Developer',
    company: 'Acme, Inc.',
    url: 'https://acme.com/jobs/1',
  }
  const stamp = new Date('2026-11-21T08:30:00.000Z')
  const lines = (text: string) => text.split('\r\n')

  it('is a one-hour event at the local time', () => {
    const ics = calendarEvent(application, step('2026-11-26', '15:00', 'Interview'), stamp)
    expect(ics.endsWith('\r\n')).toBe(true)
    expect(lines(ics)).toEqual(
      expect.arrayContaining([
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'UID:a1-20261126@findy',
        'DTSTAMP:20261121T083000Z',
        'DTSTART:20261126T150000',
        'DTEND:20261126T160000',
        'SUMMARY:Interview — Acme\\, Inc.',
        'DESCRIPTION:Frontend Developer\\nhttps://acme.com/jobs/1',
        'URL:https://acme.com/jobs/1',
        'END:VEVENT',
      ]),
    )
  })

  it('ends on the next day after 23:00', () => {
    const ics = calendarEvent(application, step('2026-12-31', '23:30'), stamp)
    expect(lines(ics)).toContain('DTEND:20270101T003000')
  })

  it('is an all-day event without a time; no link, no URL line', () => {
    const ics = calendarEvent({ ...application, url: null }, step('2026-11-26'), stamp)
    expect(lines(ics)).toEqual(
      expect.arrayContaining([
        'DTSTART;VALUE=DATE:20261126',
        'DTEND;VALUE=DATE:20261127',
        'DESCRIPTION:Frontend Developer',
      ]),
    )
    expect(ics).not.toMatch(/^URL:/m)
  })

  it('escapes text and folds long lines at 75 octets', () => {
    const text = 'Співбесіда; з Олегом\\ ' + 'дуже '.repeat(30)
    const ics = calendarEvent(application, step('2026-11-26', null, text.trim()), stamp)
    for (const line of lines(ics))
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)
    const unfolded = ics.replace(/\r\n /g, '')
    expect(unfolded).toContain('SUMMARY:Співбесіда\\; з Олегом\\\\ дуже')
  })

  it('proposes a file name without forbidden characters', () => {
    expect(calendarFileName('Acme Inc', '2026-11-26')).toBe('findy-Acme-Inc-2026-11-26.ics')
    expect(calendarFileName('A/B: "C"?', '2026-11-26')).toBe('findy-AB-C-2026-11-26.ics')
    expect(calendarFileName('***', '2026-11-26')).toBe('findy-2026-11-26.ics')
  })
})
