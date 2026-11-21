// Spec 015 FR-040…FR-042: "Add to calendar" saves one step as an .ics file. The path
// comes only from the system save dialog; nothing goes over the network.
import { calendarEvent, calendarFileName, type CalendarApplication } from '../domain/nextStep'
import type { NextStep } from '../domain/nextStep'
import type { SaveFileResult } from '../shared/ipc'

export interface CalendarSaverDeps {
  /** System save dialog; null when the user cancels */
  pickSavePath(defaultName: string): Promise<string | null>
  writeText(path: string, text: string): Promise<void>
  now(): Date
}

export function createCalendarSaver(deps: CalendarSaverDeps) {
  return {
    /** FR-042: a failed write rejects, and the IPC layer reports it as STORAGE */
    async save(application: CalendarApplication, step: NextStep): Promise<SaveFileResult> {
      const path = await deps.pickSavePath(calendarFileName(application.company, step.date))
      if (path === null) return { status: 'cancelled' }
      await deps.writeText(path, calendarEvent(application, step, deps.now()))
      return { status: 'saved' }
    },
  }
}

export type CalendarSaver = ReturnType<typeof createCalendarSaver>
