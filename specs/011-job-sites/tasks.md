# Tasks: Job sites

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

Legend: `[P]` — can run in parallel with other `[P]` tasks in the same phase.
Each task references the requirement(s) it satisfies.

## Phase 0 — Constitution

- [ ] T000 Amendment §II.8 (#28) merged before Phase 2

## Phase 1 — Domain

- [x] T001 [P] `domain/sites/known.ts` and `url.ts`: the 14 sites, groups, `siteUrl` with the three encodings; unit tests for every site with an empty query, spaces, Ukrainian letters, `&`, `#`, `/` (FR-002, FR-006)
- [x] T002 [P] `domain/sites/validate.ts` and the zod schemas: name, address, `{query}` rules, 50 sites; unit tests (FR-010, FR-013)
- [x] T003 [P] `domain/sites/icons.ts`: declared icon from HTML, image type from bytes; unit tests (FR-022)

## Phase 2 — Main

- [x] T010 Migration 003 + `SitesStore` + settings `hiddenSites`, `siteQuery`; migration test on a v2 fixture; repository tests, reset keeps them (FR-012)
- [x] T011 `main/http.ts` from `main/vacancy.ts` (no behaviour change; spec 009 tests still pass) (D-3)
- [ ] T012 `main/siteIcons.ts`: fetcher with the host rule, retry once a day, 4 at a time, event; unit tests with fakes (FR-021…FR-023, NFR-001)
- [ ] T013 IPC: site calls, icons, event; preload; tests (FR-010…FR-016, FR-021)

## Phase 3 — UI

- [ ] T020 Third tab and Ctrl/Cmd+3 (FR-001)
- [ ] T021 `SitesView`: query field (saved), groups, tiles with icon or letter, open in the browser (FR-003…FR-006, FR-020, FR-023)
- [ ] T022 The user's sites: add / edit dialog, delete with confirmation; known sites: hide and "Show hidden sites" (FR-010…FR-016)
- [ ] T023 en/uk strings; 800 × 600 layout (US-5, NFR-002)

## Phase 4 — Verification and docs

- [ ] T030 e2e with a local icon server and captured links: US-1…US-5; axe; offline icons; check the blocked search formats by hand in the dev app (NFR-002, NFR-003, SC-001, SC-002)
- [ ] T031 Docs: data-model.md, contracts/database.md (schema v3), contracts/ipc.md, architecture.md (D-13), security.md
