# Feature Spec: MVP — Job-search board

- **ID:** 001-mvp-board
- **Status:** Implemented (0.1.0)
- **Created:** 2026-11-17
- **Approved:** 2026-11-17

## Summary

Job seekers send dozens of applications and quickly lose track of where each
one stands. Findy is a desktop app that shows every application as a card on a
board whose columns are the stages of a hiring process. The user adds an
application (job title, company, vacancy link), moves it across stages as the
process advances, and keeps notes on it. The interface is available in English
and Ukrainian. Data never leaves the user's computer.

## Glossary

| Term | Meaning |
|------|---------|
| **Board** | The main screen: a set of columns, one per stage. |
| **Stage** | A step of the hiring process; shown as a column. |
| **Application** | One job the user applied for; shown as a card. ("item" in the original brief) |
| **Note** | A timestamped free-text entry attached to an application. |

## Stages

The board has exactly these stages, in this order (fixed in the MVP):

| # | Stage id | English label | Ukrainian label | Meaning |
|---|----------|---------------|-----------------|---------|
| 1 | `applied` | Applied | Заявку надіслано | Application sent |
| 2 | `hr_interview` | HR interview | HR-співбесіда | Screening call with HR / recruiter |
| 3 | `test_task` | Test task | Тестове завдання | Take-home or live test task |
| 4 | `technical_interview` | Technical interview | Технічна співбесіда | Interview with engineers |
| 5 | `c_level_interview` | C-level interview | Співбесіда з C-level | Interview with CEO/CTO/etc. |
| 6 | `offered` | Offer | Офер | Offer received |
| 7 | `rejected` | Rejected | Відмова | Rejected (by either side) |

Applications are not required to pass through every stage; any stage may be
skipped and a card may move to any column, including backwards.

## User stories

### US-1 — Add an application (P1)

As a job seeker, I want to add an application with its title, company and
vacancy link so that I have a record of every job I applied to.

**Acceptance scenarios**

1. **Given** the board is open, **When** I click "Add application", fill in
   title "Frontend Developer", company "Acme" and URL
   `https://acme.com/jobs/1` and confirm, **Then** a card with that title and
   company appears at the top of the **Applied** column.
2. **Given** the add form, **When** I leave title or company empty, **Then** the
   form cannot be submitted and the empty field is marked with an error message.
3. **Given** the add form, **When** I enter a URL that is not a valid
   `http(s)` URL (e.g. `acme jobs`), **Then** the form shows a validation error.
4. **Given** the add form, **When** I leave the URL empty, **Then** the
   application is still created (URL is optional).
5. **Given** the add form, **When** I choose a stage other than Applied,
   **Then** the card is created in that column.

### US-2 — Move an application between stages (P1)

As a job seeker, I want to move a card to another column when the hiring
process advances so that the board reflects reality.

**Acceptance scenarios**

1. **Given** a card in **Applied**, **When** I drag it onto **HR interview**,
   **Then** it appears in **HR interview** and is no longer in **Applied**.
2. **Given** a focused card, **When** I use the card's "Move to…" menu (or the
   keyboard) and pick **Rejected**, **Then** the card moves to **Rejected**.
3. **Given** several cards in one column, **When** I drag a card above another,
   **Then** the new order is kept after restarting the app.
4. **Given** a card is moved, **Then** the date of the move is recorded in the
   application's stage history.

### US-3 — Keep notes on an application (P1)

As a job seeker, I want to leave notes on an application (who I talked to,
salary discussed, next steps) so that I remember the context before the next
interview.

**Acceptance scenarios**

1. **Given** I open a card, **When** I type a note and save it, **Then** the
   note appears in the card's note list with its creation date and time.
2. **Given** an application with notes, **Then** notes are listed newest first.
3. **Given** an existing note, **When** I edit and save it, **Then** the text is
   updated and the note shows an "edited" marker.
4. **Given** an existing note, **When** I delete it and confirm, **Then** it is
   removed.
5. **Given** a card on the board, **Then** it shows the number of notes it has.

### US-4 — View, edit and delete an application (P1)

As a job seeker, I want to open a card to see and change its details, open the
vacancy page, or delete it.

**Acceptance scenarios**

1. **Given** a card, **When** I open it, **Then** I see title, company, URL,
   current stage, stage history, created/updated dates and notes.
2. **Given** an open card, **When** I change title, company, URL or stage and
   save, **Then** the board shows the updated card.
3. **Given** an application with a URL, **When** I click the link, **Then** the
   vacancy opens in my default web browser (not inside the app).
4. **Given** an open card, **When** I choose "Delete" and confirm, **Then** the
   application and its notes are removed. **When** I cancel, nothing changes.
5. **Given** a card with a vacancy URL on the board, **When** I click its link
   button, **Then** the vacancy opens in my default web browser. A card without a
   URL shows no link button.

### US-5 — Switch interface language (P1)

As a user, I want to use the app in English or Ukrainian.

**Acceptance scenarios**

1. **Given** first launch on a system whose language is Ukrainian, **Then** the
   UI is in Ukrainian; for any other system language it is in English.
2. **Given** the app is open, **When** I switch the language in settings,
   **Then** all UI text (including stage names, dialogs, validation messages and
   dates) changes immediately without restart.
3. **Given** I chose a language, **When** I restart the app, **Then** my choice
   is kept.
4. User-entered content (titles, company names, notes) is never translated.

### US-6 — Data persists locally (P1)

As a user, I want my board to be saved automatically so that I never lose
progress.

**Acceptance scenarios**

1. **Given** I made any change, **When** I close and reopen the app, **Then**
   the board is exactly as I left it.
2. **Given** the app crashes or is killed during a save, **Then** on next start
   the last successfully saved state is loaded (no corrupted/empty board).
3. **Given** the local database is unreadable or corrupted, **Then** the app
   does not modify it, keeps a backup copy, and shows an error explaining where
   the file is.

### US-7 — Install on any desktop OS (P1)

As a user, I want to download an installer for my operating system from the
project's releases page.

**Acceptance scenarios**

1. **Given** a new version is released, **Then** the GitHub Release contains
   builds for Windows (x64), macOS (Apple Silicon and Intel) and Linux (x64).
2. **Given** I install and launch any of these builds, **Then** the app starts
   and all P1 stories work.

### US-9 — Choose light or dark theme (P1)

As a user, I want to switch between a light and a dark theme so that the app is
comfortable to use in any lighting.

**Acceptance scenarios**

1. **Given** first launch, **Then** the theme follows the OS light/dark setting,
   and the "Dark theme" switch in the app menu shows the sun or the moon to match.
2. **Given** the light theme, **When** I turn on "Dark theme" in the app menu,
   **Then** the whole UI switches to the dark theme at once, without restart.
3. **Given** I chose a theme, **When** the OS theme changes, **Then** the app
   keeps my choice.
4. **Given** I chose a theme, **When** I restart the app, **Then** my choice is kept.

### US-10 — Reset the board (P2)

As a user, I want to delete all applications at once so that I can start a new
job search from an empty board.

**Acceptance scenarios**

1. **Given** a board with applications, **When** I choose "Reset board" in the
   app menu, **Then** a confirmation shows how many applications will be deleted.
2. **Given** the confirmation, **When** I cancel, **Then** nothing changes.
3. **Given** the confirmation, **When** I confirm, **Then** all applications, their
   notes and stage history are deleted and the empty board shows.
4. **Given** I confirmed, **Then** a backup copy of the database was saved first,
   and my language and theme did not change.
5. **Given** an empty board, **Then** "Reset board" is disabled.

### US-8 — Find applications quickly (P2)

As a user with many applications, I want to filter the board by text so that I
can find a specific company fast.

**Acceptance scenarios**

1. **Given** cards from "Acme" and "Globex", **When** I type "acm" in the search
   box, **Then** only cards whose title or company contains "acm"
   (case-insensitive) are shown in every column.
2. **When** I clear the search, **Then** all cards are shown again.

## Functional requirements

### Board
- **FR-001** The board MUST show the seven stages from the *Stages* table as
  columns, in that order.
- **FR-002** Each column MUST show its localised name and the number of cards in it.
- **FR-003** A card MUST show title, company, note count, and how long ago it
  entered its current stage.
- **FR-004** The board MUST scroll horizontally when columns do not fit the window.

### Applications
- **FR-010** The user MUST be able to create an application with: title
  (required, 1–200 chars), company (required, 1–200 chars), vacancy URL
  (optional, valid `http`/`https` URL, max 2048 chars) and initial stage
  (default `applied`).
- **FR-011** Leading/trailing whitespace in text fields MUST be trimmed before
  validation and saving.
- **FR-012** The user MUST be able to edit all fields of an application.
- **FR-013** The user MUST be able to delete an application after confirmation;
  deleting removes its notes.
- **FR-014** The system MUST record created and updated timestamps for each
  application.
- **FR-015** Clicking the vacancy URL MUST open it in the system default
  browser. Non-`http(s)` URLs MUST never be opened.
- **FR-016** A card with a vacancy URL MUST show a link button on the board that
  opens the URL as in FR-015. The button MUST NOT start a drag.

### Stages & ordering
- **FR-020** The user MUST be able to move a card to any stage by drag-and-drop.
- **FR-021** The user MUST be able to move a card to any stage without a mouse
  (menu or keyboard shortcut).
- **FR-022** The user MUST be able to reorder cards within a column; the order
  MUST persist.
- **FR-023** Newly created or moved cards MUST be placed at the top of the target
  column.
- **FR-024** Every stage change MUST append an entry (stage, timestamp) to the
  application's stage history; history is shown in the card details.
- **FR-025** Clicking a card or pressing Enter on it MUST open its details.
  Space picks the card up for keyboard drag-and-drop (FR-021).

### Notes
- **FR-030** The user MUST be able to add a note (1–10 000 chars) to an application.
- **FR-031** Notes MUST store creation time and, if edited, last edit time.
- **FR-032** The user MUST be able to edit and delete (with confirmation) a note.
- **FR-033** Notes MUST be displayed newest first, preserving line breaks.
  Notes are plain text (no markdown rendering in MVP).

### Internationalisation
- **FR-040** The UI MUST be available in English and Ukrainian.
- **FR-041** On first launch the language MUST be Ukrainian if the OS locale
  starts with `uk`, otherwise English.
- **FR-042** The user MUST be able to change the language at runtime; the choice
  MUST persist.
- **FR-043** Dates and relative times MUST be formatted according to the active
  language.
- **FR-044** Native application menus and dialogs owned by the app MUST also be
  localised.

### Persistence
- **FR-050** All data MUST be saved automatically after every change, with no
  explicit "Save" action.
- **FR-051** Data MUST be stored in a local embedded database (a single file in
  the OS per-user application data directory). No server or network is involved.
- **FR-052** Every change MUST be applied atomically: a crash or power loss
  during a change never leaves partially-applied data.
- **FR-053** The database MUST carry a schema version, and newer app versions
  MUST migrate older databases automatically, creating a backup first.
- **FR-054** If the database cannot be opened, fails an integrity check, or was
  created by a newer app version, the app MUST NOT modify it, MUST copy it to a
  timestamped backup, and MUST inform the user where the file is.

### Appearance
- **FR-080** The app menu (⋯) MUST have a "Dark theme" sun/moon switch. Until the
  user uses it, the theme follows the OS (and follows OS changes while the app runs).
- **FR-081** The switch MUST work with the keyboard and expose its on/off state to
  assistive technology (menu item checkbox).
- **FR-082** A theme change MUST apply to the whole window at once, without restart.
- **FR-083** The choice MUST persist across restarts.

### Reset (P2)
- **FR-090** The app menu in the toolbar MUST offer "Reset board", disabled when
  the board is empty.
- **FR-091** Reset MUST ask for confirmation, name the number of applications,
  and have Cancel as the default action.
- **FR-092** Before deleting, the app MUST save a backup copy of the database next
  to it (`findy.backup-reset-<timestamp>.db`).
- **FR-093** Reset MUST delete all applications with their notes and stage history
  in one transaction, and MUST keep the settings (language, theme).

### Search (P2)
- **FR-060** The board MUST offer a text filter matching title or company,
  case-insensitively, across all columns.

### Distribution
- **FR-070** Each release MUST produce: Windows x64 installer; macOS dmg for
  arm64 and x64; Linux AppImage and `.deb` for x64.
- **FR-071** Builds MUST be produced by CI from a version tag and attached to a
  GitHub Release.
- **FR-072** The app MUST show its version in an "About" dialog.
- **FR-074** A small "Found an issue?" button in the bottom-right corner MUST open
  the project's new-issue page (`https://github.com/YuraBerez/findy/issues/new/choose`)
  in the system browser. Notifications appear above it.

## Non-functional requirements

- **NFR-001 Privacy** — The app MUST make no network requests other than opening
  links in the system browser at the user's request.
- **NFR-002 Performance** — With 1 000 applications and 10 000 notes, the board
  MUST render in under 1 s after launch on a mid-range laptop, and drag-and-drop
  MUST stay smooth.
- **NFR-003 Startup** — Cold start to interactive board in under 3 s.
- **NFR-004 Security** — Must comply with constitution §III.
- **NFR-005 Accessibility** — Must comply with constitution §VIII; minimum window
  size 800×600 must remain usable.
- **NFR-006 Theme** — Both themes MUST meet WCAG 2.1 AA contrast for text and
  controls. See FR-080…083.

## Edge cases

- Very long titles/company names are truncated on the card with full text in a
  tooltip and in details.
- Duplicate applications (same company + title) are allowed; no deduplication.
- Two app instances: only a single instance may run; launching again focuses the
  existing window (prevents concurrent writes).
- System clock changes: timestamps are stored as UTC ISO-8601 and displayed in
  local time.
- Empty board: show an empty state with an "Add application" call to action.
- Disk full / write error: show a non-blocking error and keep changes in memory;
  retry on the next change.

## Out of scope (MVP)

- Custom, renamed or reordered stages; multiple boards.
- Accounts, cloud sync, mobile apps.
- Reminders, calendar integration, notifications.
- Import/export (CSV/JSON), analytics/charts.
- Extra fields (salary, location, contacts, tags) and file attachments.
- Auto-update.
- Code signing / notarisation (decision D-3 below).
- Recording who rejected (company vs. candidate); users can write it in a note.

## Success criteria

- **SC-001** A new user can add their first application within 30 seconds of
  first launch without reading docs.
- **SC-002** All acceptance scenarios of P1 stories pass on Windows, macOS and
  Linux builds produced by CI.
- **SC-003** 100 % of UI strings exist in both locales (enforced by CI).

## Decisions

Resolved clarifications (2026-11-17):

- **D-1** First column is labelled "Applied" / "Заявку надіслано" (id `applied`).
- **D-2** The **Rejected** stage has no extra fields (no "who rejected"); this
  can be recorded in a note.
- **D-3** MVP builds are unsigned; README documents how to open them on macOS
  (Gatekeeper) and Windows (SmartScreen).
- **D-4** (added 2026-11-17 at the owner's request) Users can switch between
  light and dark themes (US-9, FR-080…083). The theme follows the OS until the
  user picks one. There is no control to go back to "follow the OS" in the MVP.
  Revised 2026-11-17 (owner): language (a submenu, so more languages do not make
  the menu longer) and the theme switch moved from the toolbar into the app menu;
  the toolbar keeps search, Add and the menu.
- **D-5** (added 2026-11-17 at the owner's request) Cards with a vacancy URL show a
  link button that opens it in the browser (FR-016). Enter opens a card's details,
  Space starts a keyboard drag (FR-025).
- **D-6** (added 2026-11-17 at the owner's request) Users can reset the board
  (US-10, FR-090…093): confirmation with a count, automatic backup, settings kept.
- **D-7** (added 2026-11-17 at the owner's request) A "Found an issue?" button
  links to GitHub issues (FR-074), so users can report problems from the app.
