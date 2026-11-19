# Tasks: Stale applications

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

Legend: `[P]` — can run in parallel with other `[P]` tasks in the same phase.
Each task references the requirement(s) it satisfies.

## Phase 1 — Domain and storage

- [ ] T001 [P] `domain/stale.ts`: `staleDays`, `STALE_DAYS`, final stages; unit tests at N, N + 1, final stages, clock back, after a move (FR-001, FR-002)
- [ ] T002 [P] `domain/search.ts`: `filterApplications` with `onlyStale`; unit tests with the search (FR-006)
- [ ] T003 `Settings.staleAfterDays`: store parse and set, `StaleAfterDaysSchema`, IPC `setStaleAfterDays`; tests: default, invalid row, range, VALIDATION, reset keeps it (FR-008, FR-009)

## Phase 2 — UI

- [ ] T010 `useNow` (hourly); card mark with icon in the accessible name; `BoardActions.staleDays`; en/uk plurals (FR-003, FR-004, NFR-001)
- [ ] T011 `@ui/Button` `pressed`; `StaleToggle` in the toolbar with the count of visible columns; filter on the board with the search; off at 0; not saved (FR-005, FR-006, FR-007, FR-010)
- [ ] T012 `StaleAfterDialog` and the app menu entry; validation; en/uk (FR-008)

## Phase 3 — Verification and docs

- [ ] T020 e2e: US-1…US-4 with a seeded history; clock for US-1.6; axe with stale coloured cards in both themes; Ukrainian plurals; perf with 1 000 applications (NFR-001, NFR-002, SC-001)
- [ ] T021 Docs: data-model.md (settings row), contracts/ipc.md, contracts/database.md (settings keys)
