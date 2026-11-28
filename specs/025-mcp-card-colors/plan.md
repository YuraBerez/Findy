# Implementation Plan: Card colours through the AI assistant

- **Spec:** [spec.md](spec.md) · **Architecture:** [docs/architecture.md](../../docs/architecture.md)
- **Status:** Approved

## Summary

The colour becomes an optional field of the application input and patch (`domain/schema.ts`).
The application store writes it in the same `INSERT` or `UPDATE` as the other fields, so a
change of fields and colour is one transaction. The MCP tools get it from these schemas,
with a description that lists the colours, and `summary()` gives it back. The skill
describes it. No migration: the `color` column exists (spec 007).

## Constitution check

| Principle | Complies? | Notes |
|-----------|-----------|-------|
| I. Spec first | Yes | Spec 025 approved 2026-11-28 |
| II. Local-first | Yes | MCP stays stdio only and off by default (§II.5); no new tool |
| III. Secure Electron | Yes | Input checked by the same zod enum as the app (`CardColorSchema`) |
| IV. Cross-platform | Yes | No platform code |
| V. i18n | Yes | No UI text; tool and skill text is English, as before |
| VI. Tested | Yes | Repository, IPC, MCP tool and skill tests; e2e for the board update |
| VII. Simplicity | Yes | One optional field in two schemas; no new tool |
| VIII. Accessible | Yes | No UI change |

## Requirement → component

| Requirement | Component |
|-------------|-----------|
| FR-001, FR-002, FR-004, FR-005 | `domain/schema.ts` (`color` in `ApplicationInputSchema`, `ApplicationPatchSchema`), `main/db/repository/applications.ts` (`create`, `update`) |
| FR-001…FR-004 | `main/mcp/tools.ts`: field description, `summary()` gives `color` |
| FR-006 | Existing `main/watch.ts` (no change) |
| FR-007 | `skills/findy/SKILL.md` |

## Key decisions

- **D-1** The colour is part of the create input and the patch, not a second call after
  `update`: one statement, one transaction (FR-005). `setApplicationColor` stays for the
  card menu (spec 007). The IPC calls `createApplication` and `updateApplication` accept the
  colour too; the renderer does not send it, so nothing changes in the app.
- **D-2** No change to CSV (spec 008): import gives no colour, as now.

## Risks

- **A patch from the app clears the colour.** Mitigation: a missing key keeps the colour; a
  repository test covers an update without `color`.
