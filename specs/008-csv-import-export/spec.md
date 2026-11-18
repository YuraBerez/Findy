# Feature Spec: CSV export and import

- **ID:** 008-csv-import-export
- **Status:** Approved
- **Approved:** 2026-11-18 (owner)
- **Created:** 2026-11-18
- **Builds on:** [001-mvp-board](../001-mvp-board/spec.md), [002-hidden-columns](../002-hidden-columns/spec.md), [003-error-handling](../003-error-handling/spec.md), [007-card-colors](../007-card-colors/spec.md)

> Describe WHAT users need and WHY. No implementation details (no libraries,
> file names, APIs).

## Summary

The user wants to take the job search out of Findy and bring it back: open it in a
spreadsheet, keep a copy, move it to another computer, or start Findy from a table that
they already keep. The user can export all applications to one CSV file and import
applications from a CSV file. Import adds applications to the board and never deletes
or changes the existing ones. A file that Findy exported imports back with the same
data.

## User stories

### US-1 — Export the board to CSV (P1)

As a user, I want to save all my applications to a CSV file so that I can open them
in a spreadsheet or keep a copy.

**Acceptance scenarios**

1. **Given** a board with applications, **When** I choose "Export to CSV…" in the app
   menu, **Then** a save dialog opens with the proposed name `findy-<date>.csv`.
2. **When** I save, **Then** the file has one header row and one row per application,
   in board order (stage by stage, top to bottom), and a notification tells me how
   many applications were exported.
3. **Given** the language is Ukrainian, **Then** the headers, stage names and colour
   names in the file are in Ukrainian.
4. **When** I open the file in a common spreadsheet program, **Then** Ukrainian text,
   commas, quotes and line breaks in titles and notes show correctly.
5. **When** I cancel the save dialog, **Then** nothing happens and no message shows.
6. **Given** an empty board, **Then** "Export to CSV…" is disabled.

### US-2 — Import applications from CSV (P1)

As a user, I want to add applications from a CSV file so that I can restore an export
or start from my own table.

**Acceptance scenarios**

1. **When** I choose "Import from CSV…" in the app menu and select a file, **Then** a
   summary shows before anything changes: how many applications will be added, how
   many rows are skipped as duplicates, how many rows have errors (with row numbers
   and reasons), and how many applications go to hidden columns.
2. **When** I confirm, **Then** the applications are added in one step, a
   notification tells me how many, and the board shows them at once.
3. **When** I cancel the summary, **Then** nothing changes.
4. **Given** a file that Findy exported, **When** I import it into an empty board,
   **Then** every application has the same title, company, link, stage, colour,
   creation date, stage history and notes as in the file.
5. **Given** I import the same file twice, **Then** the second import adds nothing
   and the summary says that all rows are duplicates.
6. **Given** my own table with only the columns "Title" and "Company" (in English or
   Ukrainian), **When** I import it, **Then** each row becomes an application in the
   first visible stage with no colour, created now.
7. **Given** a file without a "Title" or a "Company" column, or a file that is not a
   CSV, **Then** the summary says that the file cannot be imported and why, and the
   confirm button is not available.

### US-3 — Keyboard and both languages (P1)

As a user, I want to export and import with the keyboard only, in either language.

**Acceptance scenarios**

1. **Given** a keyboard only, **When** I open the app menu, **Then** I can reach both
   items, and I can read and confirm or cancel the import summary.
2. **Given** a file exported in English, **When** I import it with the app in
   Ukrainian (or the opposite), **Then** the import works the same.

## Functional requirements

### Export

- **FR-001** The app menu MUST have "Export to CSV…". It MUST be disabled when the
  board has no applications.
- **FR-002** Export MUST ask for the file location with the system save dialog. The
  proposed name is `findy-<YYYY-MM-DD>.csv` (the local date).
- **FR-003** The file MUST have these columns, in this order: Title, Company, Link,
  Stage, Colour, Created, In stage since, Stage history, Notes. The headers, stage
  names and colour names MUST be in the active language (D-4).
- **FR-004** The file MUST contain every application, also the ones in hidden columns,
  one row each, in board order.
- **FR-005** Dates MUST be ISO 8601 date-times with the local time-zone offset (for
  example `2026-11-18T10:30:00+02:00`), so that both people and programs can read them
  and an import gets the same moment back.
- **FR-006** "Stage history" MUST have one line per stage change: the date, a space,
  an em dash, a space and the stage name. "Notes" MUST have the notes newest first;
  each note starts with a line that holds only its date in square brackets, followed
  by the note text; notes are separated by an empty line.
- **FR-007** The file MUST be UTF-8 with a byte order mark, comma-separated, with
  CRLF line ends, and a cell MUST be in double quotes when it has a comma, a quote, a
  line break, or leading or trailing spaces; a quote inside a cell is doubled.
- **FR-008** After a save, a notification MUST tell the number of exported
  applications. A failed write MUST show as in spec 003.

### Import

- **FR-010** The app menu MUST have "Import from CSV…". It MUST open the system open
  dialog, filtered to CSV files.
- **FR-011** Import MUST read UTF-8 files with or without a byte order mark, with comma
  or semicolon as the separator (detected from the header row), and with quoted cells
  that have commas, quotes and line breaks.
- **FR-012** Headers MUST be matched without regard to case and spaces at the ends, in
  English or Ukrainian. Columns with other headers MUST be ignored. "Title" and
  "Company" are required; every other column is optional.
- **FR-013** A value MUST be accepted as follows; empty means "not given":
  - Title, Company, Link: the rules of a new application (spec 001: lengths, http/https
    link).
  - Stage: an English or Ukrainian stage name, or a stage id; not given → the first
    visible stage (spec 002 FR-007).
  - Colour: an English or Ukrainian colour name, or a colour id; not given → no colour.
  - Created, In stage since, history and note dates: ISO 8601; not given → now.
  - Stage history: lines in the FR-006 format. If the last entry is not the row's
    stage, a change to that stage is added at "In stage since". Not given → one entry
    for the stage at "In stage since" (or Created).
  - Notes: in the FR-006 format; text without date lines is one note dated now.
- **FR-014** A row with a value that FR-013 does not accept MUST be skipped and listed
  in the summary with its row number (as a spreadsheet shows it) and the reason. Other
  rows are still imported.
- **FR-015** A row MUST be skipped as a duplicate when an application with the same
  title, company and link (case-insensitive, trimmed) is on the board or earlier in the
  same file.
- **FR-016** A row whose stage is hidden MUST be imported into that stage (D-6). The
  summary MUST show how many applications go to hidden columns.
- **FR-017** Nothing MUST change before the user confirms the summary (FR-020). After
  confirmation, all accepted rows MUST be added in one transaction: all or none.
- **FR-018** Imported applications MUST go on top of their columns, in file order
  (the first row of a stage ends on top), above the existing cards.
- **FR-019** A Findy export MUST import back without loss of: title, company, link,
  stage, colour, creation date, stage history (dates to the second) and note texts
  and dates. The edit date of a note is not kept (it is not in the file).
- **FR-020** The summary MUST be a dialog with: the file name, the counts of FR-014,
  FR-015 and FR-016 and of rows to add, the first 20 row errors, and the buttons
  "Import N applications" and "Cancel". With nothing to add, only "Close" shows.

### Both

- **FR-030** Both actions MUST be reachable by keyboard (constitution §VIII).
- **FR-031** The file is read and written only after the user picks it in a system
  dialog. The app MUST NOT read or write any other path for this feature.

## Non-functional requirements

- **NFR-001** Both languages, keyboard access and WCAG 2.1 AA, as in spec 001.
- **NFR-002** Spreadsheet formula safety: on export, a cell that starts with `=`, `+`,
  `-`, `@`, a tab or a carriage return MUST be written with a leading apostrophe, so
  that a spreadsheet does not run it as a formula. Import MUST remove that apostrophe
  again, so that the value round-trips.
- **NFR-003** Export and import of 1 000 applications with 5 notes each MUST finish in
  under 2 seconds on the reference machine (spec 001).
- **NFR-004** Import MUST refuse a file larger than 10 MB or with more than 5 000 rows,
  with a clear message, before it parses the rows.

## Edge cases

- A note or a title with commas, quotes, line breaks, emoji or Ukrainian text →
  round-trips unchanged.
- A cell that starts with `=` in the user's own table (without the apostrophe) →
  imported as text, never evaluated.
- A file with only a header row → the summary says that there is nothing to import.
- The same application twice in one file → the second row is a duplicate (FR-015).
- A link that is not http/https → the row is skipped with the reason.
- A stage history with dates out of order → sorted by date on import.
- An MCP client changes the board while the summary is open → duplicates and counts
  are checked again at confirmation; the result notification has the real count.
- Excel saves the file with semicolons in some locales → FR-011.
- A file in another encoding (for example Windows-1251) → Ukrainian text shows wrong;
  out of scope (D-7).

## Out of scope

- Replacing the board on import, or updating existing applications from a file.
- A column-mapping dialog for arbitrary CSV headers.
- Other formats (JSON, XLSX) and encodings other than UTF-8.
- Export of settings or hidden-column choices.
- Export or import through the MCP server (spec 004).
- Export of a filtered board (the search filter does not change the export).

## Success criteria

- **SC-001** Export, then import into an empty board, gives the same board (FR-019),
  checked by an automated test.
- **SC-002** A user can bring a two-column table (Title, Company) into Findy in under a
  minute, without editing the file.

## Decisions

- **D-1** One file for everything: a row per application, notes and stage history in
  one cell each (not separate files).
- **D-2** Import adds to the board; it never replaces or changes existing data.
- **D-3** Accepted input: Findy's own format, plus any table that uses the same
  headers in English or Ukrainian. Only Title and Company are required. No mapping
  dialog.
- **D-4** The exported file uses the language of the app for headers and for stage and
  colour names. Import understands both languages and the ids.
- **D-5** Duplicates (same title, company and link) are skipped and counted.
- **D-6** A row for a hidden stage goes into that stage. This is the only way, besides
  hiding a column, that a card can be in a hidden column; spec 002 FR-005 and FR-006
  still hold for moves and for new applications made in the app.
- **D-7** Defaults chosen without a question (change them before approval if needed):
  the menu place (app menu), ISO dates with offset, comma + BOM on export, the note and
  history cell format, the apostrophe for formula safety, limits of 10 MB and 5 000
  rows, UTF-8 only.

## Open questions

None.
