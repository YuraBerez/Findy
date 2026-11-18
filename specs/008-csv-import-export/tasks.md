# Tasks: CSV export and import

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

Legend: `[P]` — can run in parallel with other `[P]` tasks in the same phase.
Each task references the requirement(s) it satisfies.

## Phase 1 — Domain

- [x] T001 `domain/csv.ts`: writer (BOM, CRLF, quoting) and reader (BOM, `,`/`;`, quotes, line breaks), formula guard and its removal; unit tests (FR-007, FR-011, NFR-002)
- [x] T002 `domain/transfer`: columns, labels, dates with offset, `exportTable`; unit tests (FR-003…FR-006)
- [x] T003 `domain/transfer`: `planImport` (headers in en/uk, values, history, notes, row errors, duplicates, hidden, limits); round-trip test; 1 000 × 5 notes timing (FR-012…FR-016, FR-019, SC-001, NFR-003, NFR-004)

## Phase 2 — Main

- [ ] T010 `Repository.importApplications`: one transaction, top of columns in file order, hidden stages allowed; tests (FR-017, FR-018, D-6)
- [ ] T011 `main/transfer.ts` + IPC `exportCsv`, `previewImport`, `confirmImport`; locale labels; tests with fake dialogs and files (FR-002, FR-008, FR-010, FR-017, FR-031, NFR-004)

## Phase 3 — UI

- [ ] T020 Notifications: `info` tone and `notify` (FR-008, US-2.2)
- [ ] T021 App menu items, `ImportDialog`, `useAppState` actions; en/uk strings with plurals (FR-001, FR-010, FR-020, FR-030)

## Phase 4 — Verification and docs

- [ ] T030 e2e with stubbed dialogs: export file content (en, uk), import summary, confirm, cancel, duplicates, own two-column table, invalid file, keyboard, round-trip; axe on the summary (US-1…US-3, NFR-001)
- [ ] T031 Docs: contracts/ipc.md, architecture.md (D-11), security.md (file access)
