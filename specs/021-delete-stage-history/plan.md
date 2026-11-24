# Implementation Plan: Delete stage history entries

- **Spec:** [spec.md](spec.md) · **Architecture:** [docs/architecture.md](../../docs/architecture.md)
- **Status:** Approved

## Summary

A pure domain function removes one entry from a stage history and merges equal
neighbours (FR-004). A new IPC call `deleteStageChange` runs it in main, in one
transaction, on the rows of `stage_changes`. If the last stage changes, the same
transaction moves the card to the top of the new column (FR-005). The renderer adds a
delete button with a confirmation dialog to each row of the stage history in the
details panel. No schema change.

## Technical context

| Item | Choice |
|------|--------|
| Language | TypeScript (strict) |
| Frameworks | Electron, React, zod |
| Storage | SQLite, table `stage_changes` (no migration) |
| Testing | Vitest (domain, repository, IPC), Playwright e2e |
| Target platforms | Windows, macOS, Linux |

## Constitution check

| Principle | Complies? | Notes |
|-----------|-----------|-------|
| I. Spec first | Yes | Spec 021 approved 2026-11-24 |
| II. Local-first | Yes | Local data only; no network |
| III. Secure Electron | Yes | One new IPC call, arguments parsed with zod in main |
| IV. Cross-platform | Yes | No platform code |
| V. i18n | Yes | New strings in `en` and `uk`; the date uses the active locale |
| VI. Tested | Yes | Unit tests for the domain function, repository and IPC; e2e for US-1…US-5 |
| VII. Simplicity | Yes | No new dependency, no schema change, no MCP change |
| VIII. Accessible | Yes | A button per entry with the stage and the date in its name; focus returns to the history |

## Architecture

```
StageHistory (renderer) ──deleteStageChange(id, {index, stage, at})──▶ ipc.ts (zod)
                                                                        │
                                       Repository.deleteStageChange ◀───┘
                                        └─ ApplicationStore: one transaction
                                           ├─ rows of stage_changes (ORDER BY at, id)
                                           ├─ domain removeStageChange(rows, index) → kept rows
                                           ├─ DELETE the rows that are not kept
                                           └─ if the last stage changed: stage, position 0, renumber both columns
```

The renderer gets the full new state back, as for every mutation. Analytics, "in stage
since" and the stale mark are computed from `stageHistory`, so they update without
other changes (FR-009). CSV export reads the same history (FR-011).

| Requirement | Component |
|-------------|-----------|
| FR-001, FR-002, FR-003 | `features/applications/StageHistory`, `ApplicationDetails`, `App` |
| FR-004 | `domain/history.ts#removeStageChange` |
| FR-005, FR-006, FR-007, FR-008, FR-010 | `main/db/repository/applications.ts#deleteStageChange` |
| FR-009, FR-011 | No change: derived from `stageHistory` |
| NFR-001 | `locales/en.json`, `locales/uk.json` |
| NFR-002 | `StageHistory`: accessible name, focus after the dialog |
| NFR-003 | `StageHistory.module.css`: the button does not change the row height |

## Key decisions

### D-1 — How the renderer names an entry

- **Options considered:** a new `id` in `StageChange`; the index only; the index with
  the stage and the time.
- **Chosen:** `{ index, stage, at }`. Main deletes the entry at `index` only if its stage
  and time are equal to the given ones. If not, it rejects with `NOT_FOUND`, and the
  renderer loads the state again (spec edge case: an AI assistant changed the history).
- **Why:** no change to the `StageChange` type, the MCP output or the CSV format. The
  index tells apart two equal entries (spec edge case).

### D-2 — The only entry

`deleteStageChange` on a history with one entry rejects with `VALIDATION` (new
`OnlyStageChangeError`). The renderer does not show the button (FR-002), so only a
wrong call gets this error.

### D-3 — The card after a change of the last stage

The card goes to position 0 of the new stage, as after a move (001 FR-023); both
columns are renumbered. A hidden stage is allowed (spec edge case), the same as for an
import. No new history entry (FR-008). The offer question (spec 013) is asked only after
a move in the renderer, so this call does not start it.

### D-4 — The delete button

An `IconButton` with the trash icon at the end of each row, the same as for notes. It is
in the layout always, so the row does not move (NFR-003). It is faint and gets full
colour on hover and keyboard focus. Its name is "Delete entry: <stage>, <date>". After
the dialog closes, the focus goes to the history list (US-5.2), because the row of the
button can be gone.

## Risks

- **Index is out of date** because the history changed in another process. Mitigation:
  D-1 check; `NOT_FOUND` makes the renderer refresh (`useAppState.run`).
- **Row height grows** because the button (26 px) is taller than the line (20 px).
  Mitigation: negative block margin on the button; the e2e a11y check covers the panel.
