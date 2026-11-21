# Implementation Plan: One settings window

- **Spec:** [spec.md](spec.md) · **Architecture:** [docs/architecture.md](../../docs/architecture.md)
- **Status:** Approved

## Summary

A wide dialog with a vertical tab list of categories replaces the settings entries of
the ⋯ menu and the dialogs "Columns…", "Stale after…" and "AI assistant access". The
pages reuse the parts of those dialogs: the column switches, the stale field (now saved on
blur or Enter) and the MCP content. The native menu gets **Settings…** with the
accelerator Cmd/Ctrl+,; main sends an event, and the renderer opens the window. No change
to stored data, IPC calls or the database.

## Technical context

| Item | Choice |
|------|--------|
| Language | TypeScript (strict), React |
| UI | `@ui/Dialog` variant `wide` (fixed size, the content scrolls itself); `@ui/Tabs` with `orientation="vertical"` |
| Storage | No change: the existing settings and IPC setters |
| Shortcut | The accelerator of the native menu item, so it works the same on all systems |
| Testing | Vitest: the menu template; e2e: every acceptance scenario, axe in both themes, 800 × 600 in Ukrainian |
| Target platforms | Windows, macOS, Linux |

## Constitution check

| Principle | Complies? | Notes |
|-----------|-----------|-------|
| I. Spec first | ✅ | Spec 018, approved 2026-11-21; D-2 and D-3 changed after the review, in the spec |
| II. Local-first | ✅ | No network, no new data |
| III. Secure Electron | ✅ | One new main → renderer event without a payload; no new IPC call |
| IV. Cross-platform | ✅ | The accelerator `CmdOrCtrl+,`; the item in the Findy menu (macOS) or the File menu |
| V. i18n | ✅ | Category names, theme names and hints in en + uk; languages named in themselves |
| VI. Tested | ✅ | Unit test of the menu; e2e of each scenario; the old dialog tests move to the window |
| VII. Simplicity | ✅ | The parts of the old dialogs are reused, not rewritten; the dialogs are deleted |
| VIII. Accessible | ✅ | ARIA tabs (↑/↓, Home, End), labelled controls, one scroll area |

## Requirement → component map

| Requirements | Where |
|--------------|-------|
| FR-001, FR-005 | `features/settings/SettingsDialog/`; `ui/Tabs` (vertical); `ui/Dialog` (`wide`) |
| FR-002, FR-004 | `main/menuTemplate.ts` (Settings… with `CmdOrCtrl+,`, `enabled`), `main/menu.ts#setSettingsAction`, `main/index.ts` (the `openSettings` event); `app/App` opens the window unless a dialog is open |
| FR-003 | `@ui/Dialog` (Close, Esc) |
| FR-010, FR-011 | The existing actions of `useAppState`; the theme select with System |
| FR-012 | `features/settings/ColumnSwitches/` (from the old "Columns…" dialog) |
| FR-013 | `features/stale/StaleAfterField/` (from the old "Stale after…" dialog) |
| FR-020 | `app/Toolbar` |
| FR-021 | `main/mcp/tools.ts` (the answer when access is off), `skills/findy/SKILL.md`, README en/uk |
| NFR-003 | `ui/Dialog`: the modal is not higher than the window; a dialog without a footer has space below |

## Key decisions

### D-1 — The shortcut is a menu accelerator

- **Options considered:** a key listener in the renderer; the accelerator of the native
  menu item.
- **Chosen:** the accelerator.
- **Why:** the native item needs it anyway (FR-002); a second listener would open the
  window twice. The renderer still checks that no other dialog is open.

### D-2 — Reuse the old dialogs as parts

- **Chosen:** the column switches, the stale field and the MCP content become components
  without their dialog; the dialogs are deleted.
- **Why:** constitution §VII and the rule against duplicate controls (architecture D-7).

## Risks

- **Many e2e flows used the old menu items** (language, theme, columns, stale, MCP, the
  update switch) → the board screen keeps its verbs, and they now go through the window.
- **A setting saved on blur** can be lost when the user presses Esc → the spec names it
  as an edge case; the field saves on Enter and on blur.
