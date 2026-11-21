// Spec 015: the reminder scheduler and the calendar saver in main
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { StepRef } from '../../src/domain/nextStep'
import { createCalendarSaver } from '../../src/main/calendar'
import { createMainTranslator } from '../../src/main/i18n'
import { CHECK_INTERVAL_MS, createReminders, type ReminderNotice } from '../../src/main/reminders'

const ref = (over: Partial<StepRef> = {}): StepRef => ({
  id: 'a',
  title: 'Frontend Developer',
  company: 'Acme',
  stage: 'technical_interview',
  nextStep: { text: 'Interview with Oleh', date: '2026-11-21', time: '15:00' },
  ...over,
})

function setup(refs: StepRef[], language: 'en' | 'uk' = 'en') {
  const shown: ReminderNotice[] = []
  let now = new Date(2026, 10, 21, 14, 44)
  let enabled = true
  const reminders = createReminders({
    listSteps: () => refs,
    enabled: () => enabled,
    translator: () => ({ t: createMainTranslator(language), language }),
    show: (notice) => shown.push(notice),
    now: () => now,
  })
  return {
    reminders,
    shown,
    at: (hours: number, minutes: number, seconds = 0) => {
      now = new Date(2026, 10, 21, hours, minutes, seconds)
    },
    disable: () => {
      enabled = false
    },
  }
}

describe('createReminders (FR-032…FR-036)', () => {
  it('shows "in 15 min" and "in 1 min", each once (FR-032, FR-033)', () => {
    const ctx = setup([ref()])
    ctx.reminders.check()
    expect(ctx.shown).toEqual([])
    ctx.at(14, 45)
    ctx.reminders.check()
    ctx.at(14, 45, 30)
    ctx.reminders.check()
    ctx.at(14, 59, 5)
    ctx.reminders.check()
    ctx.reminders.check()
    expect(ctx.shown.map((notice) => notice.title)).toEqual([
      'In 15 min: Interview with Oleh',
      'In 1 min: Interview with Oleh',
    ])
    expect(ctx.shown[0]).toMatchObject({ applicationId: 'a' })
    expect(ctx.shown[0]!.body).toMatch(/^Frontend Developer · Acme, at 3:00\sPM$/)
  })

  it('writes the Ukrainian text', () => {
    const ctx = setup([ref()], 'uk')
    ctx.at(14, 59)
    ctx.reminders.check()
    expect(ctx.shown[0]).toMatchObject({
      title: 'Через 1 хв: Interview with Oleh',
      body: 'Frontend Developer · Acme, о 15:00',
    })
  })

  it('a new date or time gives new reminders (FR-033)', () => {
    const refs = [ref()]
    const ctx = setup(refs)
    ctx.at(14, 59)
    ctx.reminders.check()
    refs[0] = ref({ nextStep: { ...refs[0]!.nextStep, time: '15:10' } })
    ctx.at(15, 9)
    ctx.reminders.check()
    expect(ctx.shown).toHaveLength(2)
  })

  it('shows nothing when Reminders are off (FR-030)', () => {
    const ctx = setup([ref()])
    ctx.disable()
    ctx.at(14, 59)
    ctx.reminders.check()
    expect(ctx.shown).toEqual([])
  })

  describe('start', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('checks at once and then on an interval until stopped', () => {
      const listSteps = vi.fn(() => [])
      const reminders = createReminders({
        listSteps,
        enabled: () => true,
        translator: () => ({ t: createMainTranslator('en'), language: 'en' }),
        show: () => {},
        now: () => new Date(),
      })
      const stop = reminders.start()
      expect(listSteps).toHaveBeenCalledTimes(1)
      vi.advanceTimersByTime(CHECK_INTERVAL_MS * 2)
      expect(listSteps).toHaveBeenCalledTimes(3)
      stop()
      vi.advanceTimersByTime(CHECK_INTERVAL_MS * 2)
      expect(listSteps).toHaveBeenCalledTimes(3)
    })
  })
})

describe('createCalendarSaver (FR-040…FR-042)', () => {
  const application = { id: 'a', title: 'Dev', company: 'Acme', url: null }
  const step = { text: 'Call', date: '2026-11-26', time: null }

  it('proposes the file name and writes the event', async () => {
    const writeText = vi.fn(async () => {})
    const pickSavePath = vi.fn(async () => '/home/me/x.ics')
    const saver = createCalendarSaver({ pickSavePath, writeText, now: () => new Date(0) })
    expect(await saver.save(application, step)).toEqual({ status: 'saved' })
    expect(pickSavePath).toHaveBeenCalledWith('findy-Acme-2026-11-26.ics')
    expect(writeText).toHaveBeenCalledWith(
      '/home/me/x.ics',
      expect.stringContaining('DTSTART;VALUE=DATE:20261126'),
    )
  })

  it('writes nothing when the user cancels', async () => {
    const writeText = vi.fn(async () => {})
    const saver = createCalendarSaver({
      pickSavePath: async () => null,
      writeText,
      now: () => new Date(0),
    })
    expect(await saver.save(application, step)).toEqual({ status: 'cancelled' })
    expect(writeText).not.toHaveBeenCalled()
  })
})
