# Implementation Plan: CSV export and import

- **Spec:** [spec.md](spec.md) · **Architecture:** [docs/architecture.md](../../docs/architecture.md)
- **Status:** Approved

## Summary

All CSV logic is pure and lives in `src/domain`: a small RFC 4180 reader and writer, and
the mapping between applications and table rows (columns, dates, stage history, notes,
duplicates). The main process owns the files: it opens the system save and open dialogs,
reads and writes only the path that the user picked, and keeps a picked import file in
memory until the user confirms. The renderer never sees a path (FR-031). Import is two
IPC calls: `previewImport()` returns the summary, `confirmImport(token)` plans the rows
again against the current board and adds them in one transaction. No new dependency, no
migration.

## Technical context

| Item | Choice |
|------|--------|
| Language | TypeScript (strict) |
| CSV | Own reader/writer in `domain/csv.ts` (≈ 100 lines): no library needed for one format |
| Files | Electron `dialog.showSaveDialog` / `showOpenDialog`, `fs/promises` in main; injected, so unit tests use fakes |
| Storage | `Repository.importApplications` — one transaction; no schema change |
| Testing | Vitest (CSV, mapping, round-trip, repository, transfer service, IPC); e2e with the dialogs stubbed in main |
| Target platforms | Windows, macOS, Linux (native dialogs on each) |

## Constitution check

| Principle | Complies? | Notes |
|-----------|-----------|-------|
| I. Spec first | ✅ | Spec 008, approved 2026-11-18 |
| II. Local-first | ✅ | Local files only; nothing leaves the machine |
| III. Secure Electron | ✅ | Paths come only from native dialogs in main; renderer gets counts and a random token; IPC input parsed with zod; size limit before parse; formula guard (NFR-002) |
| IV. Cross-platform | ✅ | CRLF + BOM for Excel on Windows; `;` accepted on import; native dialogs |
| V. i18n | ✅ | Headers, stage and colour names from the locale files; import accepts both languages; all messages en + uk with Ukrainian plurals |
| VI. Tested | ✅ | Unit: CSV edge cases, every FR-013 rule, round-trip (SC-001), 1 000 × 5 notes timing (NFR-003); e2e: every acceptance scenario |
| VII. Simplicity | ✅ | No CSV library, no mapping UI, no new table |
| VIII. Accessible | ✅ | Menu items and a `Dialog` (existing a11y); axe on the summary |

## Requirement → component map

| Requirements | Where |
|--------------|-------|
| FR-007, FR-011, NFR-002 | `domain/csv.ts`: `writeCsv(rows)`, `readCsv(text)` (BOM, `,`/`;` from the header row, quotes, CRLF/LF), formula guard and its removal |
| FR-003…FR-006 | `domain/transfer/export.ts`: `exportTable(applications, labels, offsetOf)`; `domain/transfer/dates.ts`: ISO with local offset, parse ISO |
| FR-012…FR-016, FR-019 | `domain/transfer/import.ts`: `planImport(table, context)` → `{ items, errors, duplicates, hidden }` or a fatal reason |
| Labels | `domain/transfer/columns.ts`: column ids; `TransferLabels` (headers, stage and colour names for one language), built in main from the locale files |
| FR-017, FR-018 | `ApplicationStore.importMany(items)`: shift positions, insert applications, history, notes, all in one transaction; no hidden-stage check (D-6) |
| FR-002, FR-008, FR-010, FR-031, NFR-004 | `main/transfer.ts#createTransfer`: dialogs, file size check, pending import by token; IPC `exportCsv`, `previewImport`, `confirmImport` |
| FR-001, FR-010, FR-030 | `features/transfer/useTransferMenu` entries in the Toolbar app menu |
| FR-020 | `features/transfer/ImportDialog` (summary, errors list, confirm / cancel / close) |
| FR-008, US-2.2 | Notifications get an `info` tone (`role="status"`), `notify(text)` next to `notifyError` |

## IPC contract change

```ts
exportCsv(language: 'en' | 'uk'): Promise<{ status: 'saved'; count: number } | { status: 'cancelled' }>;
previewImport(): Promise<ImportPreview | null>;           // null: the user cancelled the dialog
confirmImport(token: string): Promise<{ state: AppState; added: number }>;

type ImportPreview = {
  token: string;            // random; the main process keeps the file text for it
  fileName: string;         // base name only, never the path
  fatal: null | { reason: 'tooLarge' | 'tooManyRows' | 'notCsv' | 'missingColumns' | 'noRows';
                  columns?: ('title' | 'company')[] };
  toAdd: number; duplicates: number; hidden: number;
  errors: { row: number; field: ImportField; problem: 'required' | 'tooLong' | 'invalid' }[];  // all; UI shows 20
};
```

`confirmImport` with an unknown token → `NOT_FOUND`. The token is dropped after a
confirm, a new preview, or a cancel (the next preview replaces it).

## Key decisions

### D-1 — Two-step import with a token, file text kept in main

- **Options considered:** renderer reads the file (needs a path or the File API); one
  call that imports at once; preview + confirm.
- **Chosen:** preview + confirm, main keeps the text.
- **Why:** FR-017 (nothing changes before confirm) and FR-031 (no path in the
  renderer). Confirm plans the rows again, so an MCP change between the two calls is
  counted right (edge case).

### D-2 — Own CSV reader and writer

- **Why:** RFC 4180 with two separators is small and fully testable; a library would
  add a dependency for ~100 lines (constitution §VII).

### D-3 — Labels from the locale files, not hard-coded

- **Why:** the file uses the app language (spec D-4); import must know the names in
  both languages. Main builds `TransferLabels` for `en` and `uk` from the same locale
  files, so a renamed stage in a locale changes export and import together.

## Risks

- **Excel opens a comma CSV in one column in some locales** → the BOM makes Excel read
  UTF-8; the `;` case is covered on import. Document in the README if users report it.
- **Time zones in tests** → `offsetOf` is injected; tests use fixed offsets.
- **Large files** → size check (10 MB) before reading the whole text, row check before
  planning; NFR-003 timing test with 1 000 × 5 notes.
