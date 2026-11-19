# Feature Spec: Stale applications

- **ID:** 010-stale-applications
- **Status:** Approved
- **Approved:** 2026-11-19 (owner)
- **Created:** 2026-11-19
- **Builds on:** [001-mvp-board](../001-mvp-board/spec.md) (FR-003 time in stage, US-8 search), [002-hidden-columns](../002-hidden-columns/spec.md)

## Summary

In a job search, many applications stop moving: a company does not answer, or the
user forgets to follow up. On a full board such cards are hard to see. Findy marks an
application as "stale" when it has stayed in its stage longer than N days (14 by
default; the user can change N), so the user sees which ones need a follow-up or can be
closed. Only a stage change resets the count. The final stages, Offer and Rejected,
are never stale.

## User stories

### US-1 — See stale applications on the board (P1)

As a job seeker, I want stale applications to stand out, so that I follow up in time.

**Acceptance scenarios**

1. **Given** N = 14 and an application in HR interview for 15 days, **Then** its card
   shows a "stale" mark with the number of days, for example "No movement for 15 days".
2. **Given** an application in its stage for exactly 14 days or less, **Then** its card
   has no mark.
3. **Given** a stale application, **When** I move it to another stage, **Then** the mark
   goes away at once.
4. **Given** a stale application, **When** I add a note or edit it, **Then** the mark
   stays (only a stage change counts, D-2).
5. **Given** applications in Offer and Rejected for 100 days, **Then** they have no mark.
6. **Given** the app stays open past midnight, **Then** a card that crosses N days gets
   the mark without a restart.

### US-2 — Show only stale applications (removed)

Removed after a review in the app (D-6): the marks on the cards are enough.

### US-3 — Change N (P2)

As a user, I want to set after how many days an application is stale, because I wait
longer or shorter for answers.

**Acceptance scenarios**

1. **When** I choose "Stale after…" in the app menu, **Then** a dialog shows the current
   N (14 at first) and lets me set a whole number from 3 to 90.
2. **When** I save 7, **Then** the marks use 7 at once, and after a restart too.
3. **When** I enter 2, 91, an empty value or text, **Then** the dialog shows an error and
   does not save.

### US-4 — Keyboard and both languages (P1)

1. **Given** a keyboard only, **Then** I can use the "Stale after…" dialog.
2. **Given** a screen reader, **Then** a stale card's accessible name says that it is
   stale and for how many days; the mark is not shown by colour only.
3. **Given** the app in Ukrainian, **Then** the mark and the dialog are in Ukrainian with correct plurals (1, 2, 5, 11, 21, 22, 25 days).

## Functional requirements

- **FR-001** An application MUST be stale when its stage is not Offer or Rejected and
  more than N whole days have passed since it entered that stage (the same moment as
  the card's "time in stage", spec 001 FR-003).
- **FR-002** Only a stage change MUST reset the count. Notes, edits and colour changes
  MUST NOT reset it.
- **FR-003** A stale card MUST show a mark with the text "No movement for {days}
  days" (with plurals). The mark MUST be visible as text and an icon, not only as a
  colour, and it MUST be in the card's accessible name.
- **FR-004** The marks MUST update without a restart: after a move at once, and when
  time passes at least once an hour.
- **FR-005**, **FR-006**, **FR-007** Removed (D-6): the toolbar toggle, the filter and its
  state.
- **FR-008** The app menu MUST have "Stale after…". It opens a dialog with a whole number
  of days from 3 to 90 (default 14). A value outside that range MUST NOT be saved.
- **FR-009** N MUST be saved with the other settings and kept after a restart. A reset
  of the board (spec 001 FR-090) MUST NOT change it.
- **FR-010** Removed (D-6): it was about the toggle's count.

## Non-functional requirements

- **NFR-001** Both languages, keyboard access and WCAG 2.1 AA (contrast of the mark in
  light and dark themes, also on coloured cards of spec 007), as in spec 001.
- **NFR-002** Removed (D-6): it was about the toggle.

## Edge cases

- An application moved back and forth: the count starts at the last stage change.
- An application imported from CSV with an old "In stage since" date (spec 008): it is
  stale at once, if the date is older than N days.
- The system clock goes back: days never go below 0; a card is not stale.
- A card with a colour (spec 007): the mark stays readable on every tint.

## Out of scope

- A filter or a toolbar toggle for stale applications (D-6).
- Next-step dates and reminders, system notifications (a later spec).
- A different N per stage.
- Automatic actions on stale applications (moving them to Rejected, archiving).
- "Stale" in analytics, in the CSV export or through the MCP server.
- Snoozing the mark for one application.

## Success criteria

- **SC-001** A user sees on the board, without opening any card, every application
  without movement for more than N days.

## Decisions

- **D-1** One N for all stages, 14 days by default, changeable in the app menu from 3 to
  90 (owner, 2026-11-19).
- **D-2** Only a stage change is "movement"; a note does not reset the count, so the
  mark says what the column shows: the time in the stage (owner, 2026-11-19).
- **D-3** All stages except Offer and Rejected (owner, 2026-11-19).
- **D-4** The filter is a toggle in the toolbar, next to the search, with the count; not
  saved after a restart, like the search (owner, 2026-11-19). Replaced by D-6.
- **D-5** Defaults chosen without a question (change them before approval if needed):
  "more than N days" (day N + 1 is stale); range 3–90; the mark text "No movement for
  {days} days"; update at least once an hour; the dialog for N in the app menu.

- **D-6** The toolbar toggle and the filter are removed: after a review in the app, the
  owner found the button not needed; the marks on the cards stay (owner, 2026-11-19).

## Open questions

None.
