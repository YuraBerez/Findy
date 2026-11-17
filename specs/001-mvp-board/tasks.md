# Tasks: MVP — Job-search board

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

Legend: `[P]` — can run in parallel with other `[P]` tasks in the same phase.
Tests for a task are written before (or together with) its implementation.

## Phase 1 — Setup

- [x] T001 Scaffold electron-vite + React + TypeScript (strict) project with the structure from architecture.md
- [x] T002 [P] ESLint + Prettier + `npm run lint` / `typecheck` scripts
- [x] T003 [P] Vitest config + `npm test`; coverage gate ≥ 80 % (`npm run test:coverage`); Playwright `_electron` config + `npm run test:e2e`
- [x] T004 [P] `electron-builder.yml` with targets from release.md; app id `io.github.findy`, product name `Findy` (FR-070)
- [x] T005 [P] `.github/workflows/ci.yml` — quality gate (format, lint, typecheck, unit + coverage ≥ 80 %) on every PR; e2e + `--dir` build + packaged smoke test on 3 OSes

## Phase 2 — Foundations (blocks all user stories)

- [x] T010 [P] `domain/stages.ts` — `STAGES` constant and `StageId` (FR-001)
- [x] T011 [P] `domain/schema.ts` — zod schemas for entities and IPC input (data-model.md)
- [x] T012 Add `better-sqlite3` (Node-API prebuilds, no rebuild); verify packaged app loads it on all 3 OSes in CI via `smoke:packaged` (architecture D-2)
- [x] T013 Tests + `main/db/connection.ts` + `migrate.ts` + `migrations/001-init.ts` — pragmas, `user_version`, backup before migrate, corrupt/newer-version handling (FR-051, FR-053, FR-054, US-6)
- [x] T014 Tests + `main/db/repository.ts` — CRUD for applications/notes/settings, each mutation in one transaction (FR-050, FR-052)
- [x] T015 Secure `BrowserWindow`, CSP, single-instance lock, navigation guards (security.md, NFR-004)
- [x] T016 `shared/ipc.ts` types, preload `contextBridge`, `main/ipc.ts` handler skeleton with zod parsing (contracts/ipc.md)
- [x] T017 [P] i18n setup: `locales/en.json`, `locales/uk.json`, renderer + main i18n, key-parity test (FR-040, SC-003)
- [x] T018 [P] Base layout (app shell, toolbar), CSS tokens for light and dark (NFR-006)
- [x] T019 Theme: `theme` setting + `setTheme` IPC → `nativeTheme.themeSource`; sun/moon `ThemeToggle` in toolbar; e2e for US-9 (FR-080…083)

## Phase 3 — US-1 Add application (P1)

- [x] T020 [P] Unit tests for `createApplication` (validation, trimming, defaults, history) (FR-010, FR-011, FR-014, FR-024)
- [x] T021 Implement create in `main/db/repository.ts` + IPC handler; form rules in `domain/forms.ts`
- [x] T022 `ApplicationDialog` (create mode) with inline validation messages in both languages
- [x] T023 e2e: US-1 scenarios 1–5

## Phase 4 — US-2 Board & moving cards (P1)

- [x] T030 [P] Unit tests for `moveApplication` (cross-column, reorder, order renormalisation, history only on stage change) (FR-020…024)
- [x] T031 Implement `moveApplication` + IPC
- [x] T032 `Board`, `Column`, `Card` with counts and time-in-stage (FR-001…004) — done in Phase 3, needed to show new cards
- [x] T033 dnd-kit drag-and-drop with keyboard sensor; card "Move to…" menu (FR-020, FR-021)
- [x] T034 Empty state (edge cases) — done in Phase 3
- [x] T035 e2e: US-2 scenarios 1–4

## Phase 5 — US-4 View / edit / delete (P1)

- [x] T040 [P] Unit tests for `updateApplication`, `deleteApplication` (FR-012, FR-013)
- [x] T041 Implement + IPC; `openExternal` with protocol allow-list (FR-015)
- [x] T042 Details panel: fields, stage history, dates, link, delete with confirmation
- [x] T043 e2e: US-4 scenarios 1–5
- [x] T044 Card link button (FR-016); open details by click / Enter (FR-025)

## Phase 6 — US-3 Notes (P1)

- [x] T050 [P] Unit tests for `domain/notes.ts` (FR-030…033)
- [x] T051 Implement notes ops + IPC
- [x] T052 `NotesPanel`: add, edit (with "edited" marker), delete with confirm, newest first; note count on card
- [x] T053 e2e: US-3 scenarios 1–5

## Phase 7 — US-5 Language (P1)

- [x] T060 First-launch language from OS locale (FR-041)
- [ ] T061 Language switch in settings + native menu; persist; live switch incl. menu (FR-042, FR-044) — toolbar switch done; native menu (FR-044) open
- [x] T062 Locale-aware dates/relative time; Ukrainian plural tests (FR-043)
- [x] T063 e2e: US-5 scenarios 1–4

## Phase 7b — US-10 Reset board (P2)

- [x] T064 Tests + `Repository.resetBoard()` in one transaction; settings kept (FR-093)
- [x] T065 `resetBoard` IPC with a VACUUM INTO backup first (FR-092); contract update
- [x] T066 App menu in the toolbar + confirmation with count, Cancel default (FR-090, FR-091)
- [x] T067 e2e: US-10 scenarios 1–5

## Phase 8 — US-8 Search (P2)

- [ ] T070 [P] Unit tests + `domain/search.ts` (FR-060)
- [ ] T071 `SearchBox` in toolbar
- [ ] T072 e2e: US-8 scenarios 1–2

## Phase 9 — US-7 Release (P1)

- [x] T080 App icons for all platforms in `build/` (source: `assets/logo.svg`, see docs/brand.md)
- [ ] T081 About dialog with version (FR-072)
- [ ] T082 `.github/workflows/release.yml` — tag `v*` → matrix build → draft GitHub Release (FR-071)
- [ ] T083 Manual smoke test of artifacts on Windows, macOS (arm64 + x64), Linux (SC-002)

## Phase 10 — Polish

- [ ] T090 Performance fixture: 1 000 applications / 10 000 notes; verify NFR-002, NFR-003
- [ ] T091 Accessibility pass: keyboard-only walkthrough, accessible names (NFR-005)
- [ ] T092 Screenshots in README (en + uk); `CHANGELOG.md` for 0.1.0
- [ ] T093 Set spec status to `Implemented`
