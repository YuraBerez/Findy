# Feature Spec: Next step and reminders

- **ID:** 015-next-step
- **Status:** Approved
- **Approved:** 2026-11-21 (owner)
- **Author(s):** owner
- **Created:** 2026-11-21
- **Builds on:** [001-mvp-board](../001-mvp-board/spec.md) (card, details panel, notes, US-8 search),
  [004-mcp-server](../004-mcp-server/spec.md), [008-csv-import-export](../008-csv-import-export/spec.md),
  [010-stale-applications](../010-stale-applications/spec.md) (card marks)
- **Related:** [014-application-fields](../014-application-fields/spec.md)

## Summary

A job search has many dates: an HR call on Tuesday, a test task due on Friday, an
answer to an offer by next week. Today Findy shows how long a card stays in a stage,
but not what comes next. This spec adds one "next step" to an application: a short text
and a date, with an optional time. The card shows a mark such as "Today" or "Overdue".
While Findy is open, it shows a system notification at start with the steps for today,
and 15 minutes before a step that has a time. The user can save a step as a calendar
file and open it in any calendar app.

## User stories

### US-1 — Plan the next step (Priority: P1)

As a job seeker, I want to write the next step and its date on an application, so that
I do not forget it.

**Acceptance scenarios**

1. **Given** an application, **When** I open its details, choose "Add next step", enter
   "Technical interview with Oleh", the date 26 Nov 2026 and the time 15:00, and save,
   **Then** the details panel shows the step, and the card shows a mark with the date and
   the time.
2. **Given** a step, **When** I edit its text, date or time, **Then** the card and the
   details show the new values.
3. **When** I save a step without a date or with empty text, **Then** the form shows an
   error and does not save.
4. **Given** a step, **When** I choose "Remove step", **Then** the step goes away and no
   note is added.

### US-2 — See what is due (Priority: P1)

As a job seeker, I want the board to show which steps are due, so that I know what to
do today.

**Acceptance scenarios**

1. **Given** a step for today, **Then** the card mark says "Today" (with the time, if
   set). **Given** a step for tomorrow, **Then** it says "Tomorrow".
2. **Given** a step for a date before today, or for today with a time that is already in
   the past, **Then** the mark says "Overdue" and looks different from the other marks
   (not only by colour).
3. **Given** a step two or more days later, **Then** the mark shows the short date, for
   example "Thu, 26 Nov" ("чт, 26 лист." in Ukrainian).
4. **Given** the app stays open past midnight, **Then** the marks change ("Tomorrow"
   becomes "Today") without a restart.
5. **Given** a card in Rejected, **Then** the card shows no step mark; the details panel
   still shows the step.

### US-3 — Finish a step (Priority: P1)

As a job seeker, I want to mark a step as done, so that I keep a record of it and can
plan the next one.

**Acceptance scenarios**

1. **Given** a step, **When** I choose "Done", **Then** the step goes away and a new note
   "Done: Technical interview with Oleh (26 Nov 2026, 15:00)" is added to the
   application.
2. **After** that, **Then** I can add a new step at once.

### US-4 — Get a reminder (Priority: P1)

As a job seeker, I want a system notification about my steps, so that I do not miss
them when Findy is in the background.

**Acceptance scenarios**

1. **Given** two steps for today and one overdue step, **When** I start Findy, **Then**
   one system notification says that I have 3 steps for today or overdue.
2. **Given** a step today at 15:00 and Findy is open, **When** it is 14:45, **Then** a
   system notification shows the step text, the job title and the company.
3. **When** I click a notification, **Then** the Findy window comes to the front; for a
   notification about one step, the details of that application open.
4. **Given** I turn off "Reminders" in the app menu, **Then** Findy shows no system
   notifications. The card marks still show.
5. **Given** no step for today and no overdue step, **When** I start Findy, **Then** no
   notification shows.

### US-5 — Add the step to my calendar (Priority: P2)

As a job seeker, I want to add the step to my calendar, so that my phone reminds me too.

**Acceptance scenarios**

1. **Given** a step with a time, **When** I choose "Add to calendar", **Then** a system
   save dialog opens with a proposed file name. After I save, the file opens in Google
   Calendar, Apple Calendar and Outlook as one event at that time, 1 hour long.
2. **Given** a step without a time, **Then** the event is an all-day event on that date.
3. The event title is the step text and the company. The event description has the job
   title and the vacancy link (if the application has one).

### US-6 — Search, CSV and MCP (Priority: P2)

1. **Given** a step "Call Olena", **When** I search "olena", **Then** the board shows
   that card.
2. **When** I export to CSV and import into an empty board, **Then** the step comes back
   with the same text, date and time.
3. **Given** AI assistant access is on, **When** the assistant sets a step "HR call" on
   Tuesday at 11:00, **Then** the card shows it within 2 s.

## Functional requirements

### Data

- **FR-001** An application MUST have zero or one next step. A step has:
  - Text: trimmed, 1–200 characters, one line.
  - Date: a calendar date.
  - Time: optional, hours and minutes.
- **FR-002** The date and the time MUST be local wall-clock values: a step at 15:00
  stays at 15:00 when the computer's time zone changes (D-6).
- **FR-003** A change to the step MUST update `updatedAt`. It MUST NOT add a stage
  history entry, change the card position or reset the "no movement" count.
- **FR-004** A move to another stage MUST keep the step (D-5).

### Editing

- **FR-010** The details panel MUST show the step with actions "Edit", "Done", "Remove
  step" and "Add to calendar", or an action "Add next step" when there is no step. All
  actions MUST work by keyboard.
- **FR-011** The date input MUST accept dates in the past (to record a late step).
- **FR-012** "Done" MUST remove the step and add one note to the application in one
  operation. The note text MUST be "Done: <text> (<date>[, <time>])" in the active
  language, with the date formatted for that language.
- **FR-013** The card's **⋯** menu MUST have "Next step…" that opens the details panel at
  the step.

### Card mark

- **FR-020** A card with a step MUST show a mark, unless the card is in Rejected:
  - "Overdue": the date is before today, or the date is today and the time is before
    now.
  - "Today" (+ time): the date is today and not overdue.
  - "Tomorrow" (+ time): the date is tomorrow.
  - Else the short weekday and date (+ time), formatted for the active language.
- **FR-021** "Overdue" MUST differ from the other marks by an icon or a text, not only
  by colour, with WCAG 2.1 AA contrast in both themes.
- **FR-022** The mark MUST have an accessible name with the full step text and date.
- **FR-023** The marks MUST update without a restart: after a change at once, at local
  midnight, and when a step time passes.
- **FR-024** The mark MUST show together with the "no movement" mark of spec 010 when
  both apply.

### Reminders

- **FR-030** The app menu MUST have a "Reminders" check item. It MUST be on by default
  and saved with the other settings. A board reset MUST NOT change it.
- **FR-031** When Reminders are on and at least one step is due today or overdue, Findy
  MUST show one summary notification: when the app starts, and at local midnight while
  the app runs. The text MUST give the count with correct plurals.
- **FR-032** When Reminders are on, Findy MUST show a notification 15 minutes before a
  step that has a time, while the app runs. If the computer wakes from sleep after that
  moment but before the step time, Findy MUST show it at once. After the step time,
  Findy MUST NOT show it.
- **FR-033** Findy MUST show each FR-032 notification once for a given step date and
  time. If the user changes the date or the time, the step MUST get a new reminder.
- **FR-034** Steps of applications in Rejected MUST NOT count in FR-031 and MUST NOT get
  FR-032 notifications. Steps in hidden columns (spec 002) MUST count.
- **FR-035** A click on a notification MUST bring the window to the front. For an FR-032
  notification, it MUST also open that application's details.
- **FR-036** Notifications MUST NOT show the content of notes. They MAY show the step
  text, the job title and the company.
- **FR-037** If the operating system blocks notifications, Findy MUST work as usual,
  without an error message.

### Calendar file

- **FR-040** "Add to calendar" MUST save a standard calendar file (iCalendar) with one
  event, through the system save dialog. The proposed name is
  `findy-<company>-<YYYY-MM-DD>.ics`, with characters that are not allowed in file names
  removed.
- **FR-041** The event MUST follow US-5: start at the step date and time in the local time
  zone and last 1 hour, or be an all-day event when there is no time.
- **FR-042** A failed write MUST show as in spec 003. Findy MUST NOT open a network
  connection for this action.

### Search, CSV and MCP

- **FR-050** Board search MUST also match the step text.
- **FR-051** CSV export MUST add the columns "Next step" and "Next step date" after the
  other columns (also after the columns of spec 014, when it is implemented). The date
  MUST be `YYYY-MM-DD`, or `YYYY-MM-DDTHH:MM` when the step has a time (local wall
  clock, no offset, see FR-002).
- **FR-052** CSV import MUST accept these columns as optional. A text without a valid
  date, or a date without text, MUST skip the row with a reason (spec 008 FR-014).
- **FR-053** A Findy export MUST import back without loss of the step.
- **FR-054** The MCP tools `get_application` and `list_applications` MUST return the
  step. `add_application` and `update_application` MUST set, change and clear it with
  the same rules. The MCP server MUST NOT show notifications.

## Non-functional requirements

- **NFR-001** All new text in English and Ukrainian, with Ukrainian plurals; dates and
  times use the active language (constitution §V).
- **NFR-002** Keyboard access and accessible names for every new control
  (constitution §VIII).
- **NFR-003** Reminders work the same on Windows, macOS and Linux (constitution §IV). On
  a system without notification support, FR-037 applies.
- **NFR-004** No network access (constitution §II). Notifications and the calendar file
  are local.
- **NFR-005** With 1 000 applications, the check for due steps does not slow the board in
  a way that a user can see.

## Edge cases

- The app is closed at the step time: no notification at that time. The next start shows
  the summary (FR-031), and the card says "Overdue".
- The app starts 5 minutes before a step at 15:00: the FR-032 notification shows at once,
  in addition to the summary.
- The user edits a past step to a future date: it is no longer overdue and gets a new
  reminder.
- The computer clock changes or the time zone changes: the marks and reminders use the
  new local time (FR-002).
- A step on 29 February or at a time that does not exist in a daylight saving change: the
  step keeps its values; the reminder uses the next valid moment.
- A board reset deletes the steps with the applications.

## Out of scope

- More than one step per application, a list of events, a history of steps other than
  the "Done" note.
- Reminders while Findy is closed, a tray icon, start at login.
- Two-way sync with a calendar service, a calendar feed, invites.
- A user choice of the reminder lead time (fixed at 15 minutes).
- A filter or a view "Due this week".

## Success criteria

- **SC-001** A user sees every step that is due today on the board without opening a
  card.
- **SC-002** With Findy open, a user gets a notification before every step that has a
  time.
- **SC-003** A calendar file from Findy opens as a correct event in Google Calendar,
  Apple Calendar and Outlook.

## Decisions

- **D-1** Separate from spec 014 (owner, 2026-11-21).
- **D-2** One step per application: text, date, optional time. "Done" turns the step into
  a note (owner).
- **D-3** Reminders: a card mark plus system notifications only while Findy runs; the
  user can turn them off (owner).
- **D-4** Notifications at start (and at midnight) as one summary, and 15 minutes before a
  step with a time (owner). "Add to calendar" saves an `.ics` file (owner).
- **D-5** A move to Offer or Rejected keeps the step. In Rejected the step has no mark and
  no reminders (owner).
- **D-6** Steps are local wall-clock times, because an interview at 15:00 is set in the
  user's own time; a time zone change is rare for this app.

## Open questions

None.
