# Tasks: Card colours

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

Legend: `[P]` — can run in parallel with other `[P]` tasks in the same phase.
Each task references the requirement(s) it satisfies.

## Phase 1 — Domain and storage

- [x] T001 Domain `colors.ts` (`CARD_COLORS`, `CardColor`), `Application.color`, `CardColorSchema`; unit tests (FR-001, FR-009)
- [x] T002 Migration 002 `color` column; migration test on a v1 fixture with rows (FR-006, FR-011)
- [x] T003 `Repository.setApplicationColor`; `list()` maps `color`; tests: persist, clear, keeps colour on move/update/notes, no history entry, no position change, NOT_FOUND (FR-006, FR-008)
- [x] T004 IPC `setApplicationColor` (zod, contract types, preload); tests: valid, unknown colour → VALIDATION; MCP output and `update_application` leave the colour alone (FR-004, FR-009)

## Phase 2 — UI

- [x] T010 `ui/ColorSwatch`, `ui/ColorPicker` (radiogroup, arrow keys); `Menu` submenu option `icon`; colour tokens light/dark (FR-003, FR-005)
- [x] T011 `features/colors/useColorOptions`; en/uk strings (colour names, "Colour", "None", accessible label) (FR-003, FR-010)
- [x] T012 Card ⋯ menu "Colour" submenu with the current colour; `useAppState.setApplicationColor` (FR-002, FR-004)
- [x] T013 Card tint and border, drag overlay, accessible name with the colour (FR-005, FR-010, NFR-002)
- [x] T014 Details panel "Colour" section, saves on change (FR-007)

## Phase 3 — Verification and docs

- [ ] T020 e2e: US-1 (menu, keyboard, restart), US-2 (details), US-3 (move, edit, new card); axe with coloured cards in light and dark (NFR-001, SC-002)
- [ ] T021 Docs: data-model.md, contracts/database.md (schema v2), contracts/ipc.md
