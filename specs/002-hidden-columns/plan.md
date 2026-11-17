# Implementation Plan: Hidden columns

- **Spec:** [spec.md](spec.md) · **Architecture:** [docs/architecture.md](../../docs/architecture.md)
- **Status:** Approved

## Summary

`Settings` gets `hiddenStages: StageId[]`, stored as a JSON row in `settings`.
One pure domain helper, `visibleStages(hidden)`, is the single source for every
place that lists stages: the board, the Move to menu, the forms and the keyboard
drag. Main validates moves and creates against it.

## Constitution check

| Principle | Complies? | Notes |
|-----------|-----------|-------|
| I. Spec first | ✅ | This spec |
| II. Local-first | ✅ | A settings row |
| III. Secure Electron | ✅ | New IPC call parsed with zod; main enforces FR-006 |
| IV. Cross-platform | ✅ | UI only |
| V. i18n | ✅ | en + uk keys |
| VI. Tested | ✅ | Domain, repository, IPC unit tests; e2e for every scenario |
| VII. Simplicity | ✅ | No migration; one helper |
| VIII. Accessible | ✅ | Switches in a dialog; buttons with names; axe audit |

## Requirement → component map

| Requirements | Where |
|--------------|-------|
| FR-001 | `features/board/Column` header button |
| FR-002 | `features/settings/ColumnsDialog`, Toolbar app menu |
| FR-003, D-3 | `Repository.setHiddenStages`, `getSettings`; IPC `setHiddenStages` |
| FR-004 | Hiding touches settings only |
| FR-005, FR-007 | `domain/stages.ts#visibleStages`; Board, CardActions, ApplicationFields, dnd keyboard |
| FR-006 | `main/ipc.ts`: create, move, setHiddenStages checks |

## IPC contract change

`setHiddenStages(stages: StageId[]): Promise<AppState>`; `AppState.settings`
gains `hiddenStages: StageId[]` (docs/contracts/ipc.md, docs/data-model.md).
