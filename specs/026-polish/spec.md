# Feature Spec: Polish language

- **ID:** 026-polish
- **Status:** Approved
- **Approved:** 2026-11-28 (owner)
- **Author(s):** owner
- **Created:** 2026-11-28
- **Builds on:** [001-mvp-board](../001-mvp-board/spec.md) (FR-040…FR-044),
  [008-csv-import-export](../008-csv-import-export/spec.md),
  [019-browser-extension](../019-browser-extension/spec.md) (NFR-006)
- **Changes:** spec 001 FR-040 and FR-041, and constitution §V.2 (supported languages).
  The constitution change goes in its own PR with the `constitution` label.

## Summary

Many people who look for a job in Poland, also Ukrainians who live there, want the app in
Polish. Findy has English and Ukrainian. This spec adds Polish to the app: every text of
the window, the native menu, the notifications and reminders, the analytics image, the
CSV files and the browser extension popup. The website, the guides and the README stay in
English and Ukrainian; a later spec can add them.

## User stories

### US-1 — Use Findy in Polish (Priority: P1)

As a user who speaks Polish, I want the app in Polish so that I understand every text.

**Acceptance scenarios**

1. **Given** the settings window, **When** I select "Polski" in the language list,
   **Then** the window, the board, the native menu and the next notifications are in
   Polish at once, without a restart.
2. **Given** Polish, **Then** dates, relative times, numbers and percentages use the
   Polish format, for example "28 lis 2026" and "2,5%".
3. **Given** Polish, **Then** counts use the Polish plural forms: "1 notatka",
   "2 notatki", "5 notatek".
4. **When** I restart the app, **Then** it opens in Polish.

### US-2 — Polish on the first start (Priority: P1)

As a user with a Polish system, I want Findy to start in Polish so that I do not have to
look for the setting.

**Acceptance scenarios**

1. **Given** a first start (no saved language) and a system language that starts with
   `pl`, **Then** Findy opens in Polish.
2. **Given** a system language that starts with `uk`, **Then** Findy opens in Ukrainian,
   as before. Any other language gives English.

### US-3 — CSV files in Polish (Priority: P2)

As a user, I want to export my board with Polish column names and import a Polish file
so that I can work with it in a spreadsheet.

**Acceptance scenarios**

1. **Given** Polish, **When** I export CSV, **Then** the headers, the stage names and the
   colour names are in Polish.
2. **When** I import a CSV file with Polish headers and stage names, in any app language,
   **Then** the import reads it, as it reads English and Ukrainian files (spec 008).

### US-4 — The browser extension in Polish (Priority: P2)

As a user with a Polish browser, I want the extension popup in Polish.

**Acceptance scenarios**

1. **Given** a browser with a Polish interface, **When** I open the extension popup,
   **Then** its texts and its name in the browser are in Polish.

## Functional requirements

- **FR-001** The app MUST support Polish (`pl`) as a third language, with every text that
  English and Ukrainian have. The language list in the settings shows "Polski".
- **FR-002** On the first start with no saved language, the app MUST use Polish when the
  system language starts with `pl`, Ukrainian for `uk`, else English (changes 001 FR-041).
- **FR-003** Polish counts MUST use the Polish plural forms (`one`, `few`, `many`,
  `other`).
- **FR-004** Dates, times, numbers and percentages MUST use the Polish locale (001 FR-043).
- **FR-005** The native menu, the system dialogs of the app, the notifications and the
  reminders MUST be in Polish (001 FR-044).
- **FR-006** The analytics image (spec 023) MUST be in Polish when the app is in Polish.
- **FR-007** CSV export in Polish MUST use Polish headers, stage names and colour names.
  CSV import MUST accept Polish headers and names in every app language (spec 008).
- **FR-008** The browser extension popup and its store name and description MUST be in
  Polish when the browser is in Polish (019 NFR-006).
- **FR-009** The MCP tools and the skill stay in English (spec 004 FR-008); the note that
  "Done" writes for a step (spec 015 FR-012) is in Polish when the app is in Polish.

## Non-functional requirements

- **NFR-001** A missing or extra Polish key, or a different `{{placeholder}}`, MUST fail CI,
  as for Ukrainian.
- **NFR-002** Polish texts MUST fit the layouts at the minimum window size of spec 001
  (Polish words are long): no overflow, no horizontal scroll.
- **NFR-003** The translation is checked by a person who reads Polish before the release;
  the PR lists the terms that need this check.

## Edge cases

- A saved language `pl` and an older Findy (downgrade): the older version does not know
  `pl`, and uses its own rule for the first start.
- A Polish CSV file imported while the app is in Ukrainian: it is read; the stage names in
  Polish map to the same stages.
- A system language `pl-PL`, `pl` or `pl_PL`: all are Polish.

## Out of scope

- Polish website, guides and README (a later spec).
- Other languages.
- Translation of user content (titles, companies, notes).

## Success criteria

- **SC-001** A Polish-speaking tester finds no English or Ukrainian text in the app in
  Polish, and no text that is cut or overflows.

## Decisions

- **D-1** The app, the CSV files and the extension popup get Polish; the website, the
  guides and the README do not, in this spec (owner, 2026-11-28).
- **D-2** A `pl*` system language starts the app in Polish (owner, 2026-11-28).
- **D-3** Claude translates; the owner, or a person who reads Polish, reviews the PR
  before the release (owner, 2026-11-28).

## Open questions

- None.
