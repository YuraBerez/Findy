# Implementation Plan: Next step and reminders

- **Spec:** [spec.md](spec.md) · **Architecture:** [docs/architecture.md](../../docs/architecture.md)
- **Status:** Approved

## Summary

Migration 005 adds three nullable columns to `applications` for the step text, the
date and the time. The rules live in a new pure module `domain/nextStep/`: types and
validation, the status of a step ("overdue", "today"…), the next moment when a status
changes, the due reminders, the form rules, the text formats for CSV and the calendar
file. `createApplication` and `updateApplication` get an optional `nextStep`, so the MCP
tools set it through the shared schemas. Two new IPC calls do what a patch cannot:
"Done" (remove the step and add a note in one transaction) and "Add to calendar" (an
`.ics` file through the save dialog). A reminder scheduler in main shows the system
notifications, because a renderer timer slows down when the window is in the background.
No new dependency.

## Technical context

| Item | Choice |
|------|--------|
| Language | TypeScript (strict) |
| Storage | 3 nullable columns on `applications` (migration 005); setting row `remindersEnabled` |
| Dates | Local wall-clock strings `YYYY-MM-DD` and `HH:MM` (spec D-6); `new Date(y, m, d, h, min)` gives the moment in the current time zone |
| Formatting | `Intl.DateTimeFormat` in `domain/nextStep/format.ts`, shared by the renderer (marks, details) and main (the "Done" note, notifications) |
| Notifications | Electron `Notification` in main; a 10-second check, plus a check after each IPC call, after an MCP change and on `powerMonitor` `resume` |
| Calendar file | iCalendar (RFC 5545) text built in the domain: floating local time, or `VALUE=DATE` for an all-day event |
| Testing | Vitest: domain, migration, repository, IPC, reminders with a fake clock, calendar, MCP, CSV; e2e for US-1…US-6 |
| Target platforms | Windows, macOS, Linux; `Notification.isSupported()` guards FR-037 |

## Constitution check

| Principle | Complies? | Notes |
|-----------|-----------|-------|
| I. Spec first | ✅ | Spec 015, approved 2026-11-21 |
| II. Local-first | ✅ | Notifications and the `.ics` file are local; no network (NFR-004, FR-042) |
| III. Secure Electron | ✅ | New IPC input parsed with zod in main; the file path comes only from the system save dialog; the renderer gets an event with an application id, nothing more |
| IV. Cross-platform | ✅ | Electron `Notification` on the three systems; FR-037 when it is not supported; no platform branches |
| V. i18n | ✅ | Marks, form, menu item, note text, notifications and CSV headers in en + uk; dates and times through `Intl` |
| VI. Tested | ✅ | Unit for each rule (status, boundaries, reminders, calendar, CSV); e2e for each acceptance scenario that a test can reach (see Risks) |
| VII. Simplicity | ✅ | Columns on the existing table; one scheduler; shown reminders kept in memory (D-4) |
| VIII. Accessible | ✅ | Every control through `Field`/`Button`; the card mark has text, an icon and a full accessible name; the menu entry is a toggle like the update check |

## Data model

```ts
interface NextStep {
  text: string          // trimmed, 1–200 characters, one line
  date: string          // 'YYYY-MM-DD', a real calendar date
  time: string | null   // 'HH:MM', 00:00–23:59
}

interface Application {
  nextStep: NextStep | null   // new
}

interface Settings {
  remindersEnabled: boolean   // new, default true
}
```

`nextStep` is a whole value: a patch replaces it or sets `null`. It is not part of
`ApplicationFields` (spec 014), so "Save changes" in the details form never changes it.

## Database change

```sql
-- 005-next-step
ALTER TABLE applications ADD COLUMN next_step_text TEXT
  CHECK (next_step_text IS NULL OR length(next_step_text) BETWEEN 1 AND 200);
ALTER TABLE applications ADD COLUMN next_step_date TEXT
  CHECK (next_step_date IS NULL OR next_step_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]');
ALTER TABLE applications ADD COLUMN next_step_time TEXT
  CHECK (next_step_time IS NULL OR next_step_time GLOB '[0-2][0-9]:[0-5][0-9]');
```

Schema version 5. Old rows get `NULL` (no step). The rule across columns (text and date
together, time only with a date) stays in zod; a row that breaks it reads as no step.

## IPC contract change

- `createApplication(input)` and `updateApplication(id, patch)` accept
  `nextStep?: { text, date, time? } | null`. `null` clears it; a missing key keeps it.
- New `completeNextStep(id, language)`: removes the step and adds the note
  "Done: …" in `language`, in one transaction (FR-012). `NOT_FOUND` when the
  application or its step does not exist.
- New `saveNextStepCalendar(id)`: the save dialog, then the `.ics` file
  (FR-040…FR-042). `{ status: 'saved' } | { status: 'cancelled' }`; `STORAGE` when the
  write fails.
- New `setRemindersEnabled(enabled)` (FR-030).
- New event `openApplication` (payload: the id): a click on a step notification
  (FR-035).
- `Application.nextStep` and `Settings.remindersEnabled` in `AppState`.

## MCP change

- `summary()` and `details()` return `nextStep`.
- `add_application` and `update_application` accept `nextStep` with the same schema
  (FR-054). The MCP process has no scheduler, so it shows no notification.
- `list_applications` → `query` also matches the step text (shared `matchesQuery`).
- `skills/findy/SKILL.md` describes the field.

## Requirement → component map

| Requirements | Where |
|--------------|-------|
| FR-001, FR-002 | `domain/nextStep/types.ts` (`NextStep`, `isStepDate`, `isStepTime`, `stepStart`), `domain/limits.ts` (`nextStep: 200`), `domain/schema.ts` (`NextStepSchema` in the input and patch schemas) |
| FR-001, FR-003, FR-004 | Migration `005-next-step`; `rows.ts` (`STEP_COLUMNS`, `toNextStep`, `stepValues`); `ApplicationStore.create/update/importMany` write the columns; `updatedAt` only; `move` does not touch them |
| FR-010, FR-011, US-1.3 | `features/nextStep/NextStepSection/` in the details panel; `useNextStepForm`; zod-free rules in `domain/nextStep/form.ts` |
| FR-012 | `ApplicationStore.completeNextStep(id, noteText)`; `ipc.ts#completeNextStep` builds the text with the main translator and `formatStepWhen` |
| FR-013 | `CardActions` menu entry "Next step…" → `BoardActions.openStep(id)` → the details panel opens with the focus on the step |
| FR-020…FR-022, FR-024 | `domain/nextStep/status.ts#stepStatus`; `features/board/Card` mark (`NextStepMark`), `domain/nextStep/format.ts` |
| FR-023 | `domain/nextStep/status.ts#nextStatusChange`; `hooks/useNow` waits until that moment (at most one hour, spec 010 FR-004) |
| FR-030 | `SettingsStore` row `remindersEnabled`; `features/nextStep/useRemindersMenu` toggle in the ⋯ menu |
| FR-032…FR-037 | `domain/nextStep/reminders.ts` (`dueReminders`, `reminderKey`); `main/reminders.ts#createReminders` (clock, shown keys); `main/index.ts` wires `Notification`, `powerMonitor` and the click |
| FR-040…FR-042 | `domain/nextStep/calendar.ts` (`calendarEvent`, `calendarFileName`); `main/calendar.ts#createCalendarSaver` |
| FR-050 | `domain/search.ts#matchesQuery` also checks the step text |
| FR-051…FR-053 | `domain/transfer/columns.ts` (+2 columns), `export.ts`, `import.ts` (`parseStepDateText`); `main/transfer.ts` labels |
| FR-054 | `main/mcp/tools.ts`, `skills/findy/SKILL.md` |
| NFR-001 | `locales/en.json`, `locales/uk.json` |
| NFR-005 | `Repository.listNextSteps()` reads only the rows with a step, without notes |

## Key decisions

### D-1 — Columns on `applications`

- **Options considered:** three columns; a `next_steps` table.
- **Chosen:** columns.
- **Why:** zero or one step per application (spec D-2); the same pattern as spec 014
  (architecture D-14); one row read per application.

### D-2 — The step in the patch, "Done" as its own call

- **Options considered:** a separate `setNextStep` call; `nextStep` in the
  create/update patch.
- **Chosen:** `nextStep` in the patch, plus `completeNextStep` for "Done".
- **Why:** MCP add and update need the same rules (FR-054), and the patch gives them
  for free. "Done" changes two tables in one transaction (FR-012), so it is a call of its
  own. Main writes the note text, so the language and the date format come from one
  place.

### D-3 — The scheduler in main

- **Options considered:** timers in the renderer; a scheduler in main.
- **Chosen:** main.
- **Why:** Chromium slows timers in a hidden or minimized window, so a 15-minute
  reminder could come late. Main owns the database and `Notification`, and it sees the
  MCP changes. A 10-second check is cheap with `listNextSteps()` (NFR-005) and needs no
  exact timers.

### D-4 — Shown reminders in memory

- **Options considered:** store the keys of shown reminders; keep them in memory.
- **Chosen:** memory: a set of `id|date|time|lead` keys for this run.
- **Why:** FR-033 needs "once per date, time and lead time"; a changed date or time is a
  new key. After a restart inside the 15 minutes the reminder can show once more. That is rare and
  harmless, and the spec edge case asks for a reminder at start anyway.

### D-5 — Floating local time in the calendar file

- **Options considered:** UTC (`Z`); a `TZID` with a `VTIMEZONE`; floating local time.
- **Chosen:** floating local time (`DTSTART:20261126T150000`), `VALUE=DATE` for an all-day
  event.
- **Why:** it matches spec D-6: Google Calendar, Apple Calendar and Outlook read a
  floating time in the user's own time zone. A `VTIMEZONE` needs time zone rules that
  Findy does not have.

## Risks

- **Notifications in e2e** → the test replaces `Notification.prototype.show` in main
  through the back door and reads the recorded notifications; a click is
  `notification.emit('click')`.
- **macOS asks for permission** on the first notification of an unsigned app → FR-037:
  a blocked notification fails silently.
- **Notification objects collected by GC** (the click is lost) → main keeps each one until
  it closes.
- **Intl output differs by ICU version** ("Thu, Nov 26" vs "Thu, 26 Nov") → tests use
  `Intl` for the expected text, not fixed strings.
- **The card gets taller** → one line, the same height as the stale mark; the
  performance spec with 1 000 cards stays green.
