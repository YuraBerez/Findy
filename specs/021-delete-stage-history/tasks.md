# Tasks: Delete stage history entries

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

Legend: `[P]` — can run in parallel with other `[P]` tasks in the same phase.
Each task references the requirement(s) it satisfies.

## Phase 1 — Setup

- [x] T001 Plan, tasks; `docs/contracts/ipc.md` and `docs/data-model.md` describe the new call and rule

## Phase 2 — Foundations

- [x] T010 Tests + pure `removeStageChange(history, index)`: removes the entry, merges equal neighbours into the earlier one, keeps the only entry (FR-002, FR-004)
- [x] T011 Tests + `Repository.deleteStageChange(id, entry)`: one transaction; `NOT_FOUND` for a changed or missing entry; `VALIDATION` for the only entry; a change of the last stage moves the card to the top of the new column; else the card keeps its column and position; bumps `updatedAt` only; no new entry (FR-005…FR-008, FR-010)
- [x] T012 Tests + IPC `deleteStageChange` with zod validation, preload method list and `FindyApi` type (FR-010)

## Phase 3 — User stories 1–5 (P1, P2)

- [x] T020 Delete button per history entry, hidden for the only entry; confirmation dialog with the stage, the date and the analytics note; focus back to the history; strings in `en` and `uk` (FR-001…FR-003, NFR-001…NFR-003)
- [x] T021 E2E: delete a middle entry, cancel, the last entry (card moves), merge, the only entry, keyboard; analytics shows the new history (US-1…US-5, FR-009). FR-011 needs no code: the export reads the same history

## Phase 4 — Polish

- [ ] T090 Full gate: format, lint, coverage ≥ 80 %, e2e
