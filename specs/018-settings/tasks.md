# Tasks: One settings window

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

Legend: `[P]` — can run in parallel with other `[P]` tasks in the same phase.
Each task references the requirement(s) it satisfies.

## Phase 1 — Setup

- [x] T001 Plan, tasks and docs: `docs/architecture.md` (D-17, project structure),
  `docs/contracts/ipc.md` (the `openSettings` event)

## Phase 2 — US-1, US-2: the window (P1)

- [x] T010 `ui/Tabs` vertical, `ui/Dialog` wide; one scroll area and space below (FR-005,
  NFR-003)
- [x] T011 `SettingsDialog` with General, Board, Reminders, Updates, AI assistant;
  `ColumnSwitches`, `StaleAfterField`, `McpSettings`; en + uk (FR-001, FR-010…FR-014)
- [x] T012 Native menu item with Cmd/Ctrl+,, off without a database; the `openSettings`
  event; unit tests (FR-002, FR-004)

## Phase 3 — US-3: a shorter menu (P1)

- [x] T020 ⋯ menu with actions only; the old dialogs deleted (FR-020)
- [x] T021 Texts that point to AI assistant access: MCP answer, skill, README (FR-021)

## Phase 4 — Tests and polish

- [x] T030 e2e: open (menu, shortcut, native menu), categories, each setting, a shorter
  menu; the old flows through the window; axe in both themes; 800 × 600 in Ukrainian
- [x] T031 Full gate
