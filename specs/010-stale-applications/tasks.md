# Tasks: Stale applications

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

Legend: `[P]` — can run in parallel with other `[P]` tasks in the same phase.
Each task references the requirement(s) it satisfies.

## Phase 1 — Domain and storage

- [x] T001 [P] `domain/stale.ts`: `staleDays`, `STALE_DAYS`, final stages; unit tests at N, N + 1, final stages, clock back, after a move (FR-001, FR-002)
- [x] T002 ~~`domain/search.ts`: `filterApplications` with `onlyStale`~~ — removed with the toggle (spec D-6)
- [x] T003 `Settings.staleAfterDays`: store parse and set, `StaleAfterDaysSchema`, IPC `setStaleAfterDays`; tests: default, invalid row, range, VALIDATION, reset keeps it (FR-008, FR-009)

## Phase 2 — UI

- [x] T010 `useNow` (hourly); card mark with icon in the accessible name; `BoardActions.staleDays`; en/uk plurals (FR-003, FR-004, NFR-001)
- [x] T011 ~~`StaleToggle` in the toolbar, filter, `@ui/Button` `pressed`~~ — built, then removed after review (spec D-6)
- [x] T012 `StaleAfterDialog` and the app menu entry; validation; en/uk (FR-008)

## Phase 3 — Verification and docs

- [x] T020 e2e: US-1, US-3, US-4 with a seeded history; clock for US-1.6; axe with stale coloured cards in both themes; Ukrainian plurals; 800 × 600 (NFR-001, SC-001)
- [x] T021 Docs: data-model.md (settings row), contracts/ipc.md, contracts/database.md (settings keys)
