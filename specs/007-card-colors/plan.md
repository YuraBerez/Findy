# Implementation Plan: Card colours

- **Spec:** [spec.md](spec.md) · **Architecture:** [docs/architecture.md](../../docs/architecture.md)
- **Status:** Approved

## Summary

A nullable `color` column on `applications` (migration 002), a pure list of the 7
colour ids in `src/domain`, and one new IPC call `setApplicationColor(id, color)`.
The call is separate from `updateApplication`, so the MCP tool `update_application`
(which reuses the patch schema) cannot change the colour (spec D-4). The card ⋯ menu
gets a "Colour" submenu; the details panel gets a row of colour swatches that saves at
once. The tint is a CSS mix of one colour token per colour and theme with the card
surface. No new dependency.

## Technical context

| Item | Choice |
|------|--------|
| Language | TypeScript (strict) |
| Storage | `applications.color TEXT NULL` with a CHECK on the 7 ids (migration 002) |
| UI | `ui/ColorSwatch` (sample), `ui/ColorPicker` (radio group), `Menu` submenu options get an icon |
| Testing | Vitest (domain, migration, repository, IPC, MCP unchanged); e2e for US-1…US-3; axe in both themes |
| Target platforms | Windows, macOS, Linux (no platform code) |

## Constitution check

| Principle | Complies? | Notes |
|-----------|-----------|-------|
| I. Spec first | ✅ | Spec 007, approved 2026-11-18 |
| II. Local-first | ✅ | Local column only; no network |
| III. Secure Electron | ✅ | New IPC input parsed with zod in main (id + enum or null) |
| IV. Cross-platform | ✅ | CSS and SQL only |
| V. i18n | ✅ | Colour names, "Colour", "None" in en + uk |
| VI. Tested | ✅ | Unit: migration, repository, IPC, schema; e2e: every acceptance scenario |
| VII. Simplicity | ✅ | One column, one IPC call, CSS `color-mix` for the tint, no library |
| VIII. Accessible | ✅ | Menu keyboard pattern (existing); `radiogroup` with arrow keys in the details; colour name in the card's accessible name (FR-010) |

## Requirement → component map

| Requirements | Where |
|--------------|-------|
| FR-001 | `domain/colors.ts` (`CARD_COLORS`, `CardColor`, zod-free); `Application.color` in `domain/types.ts` |
| FR-001, FR-009 | `domain/schema.ts#CardColorSchema` (enum or null); `main/ipc.ts` handler `setApplicationColor` |
| FR-006, FR-011 | Migration `002-card-color` (`ALTER TABLE … ADD COLUMN color`, NULL for old rows); `ApplicationStore.setColor`, `list()` maps `color` |
| FR-008 | `setColor` updates only `color` and `updated_at`: no `stage_changes` row, no `position` change |
| FR-002, FR-003, FR-004 | `features/board/CardActions`: separator + "Colour" submenu; `Menu` submenu option `icon` → `ui/ColorSwatch`; IPC via `useAppState.run()` |
| FR-005, NFR-002 | `Card.module.css`: `[data-color]` → `color-mix(var(--card-<id>) …, var(--surface))` background and border; tokens `--card-<id>` in `global.css` for light and dark; drag overlay gets the same attribute |
| FR-007 | `features/applications/ApplicationDetails`: section "Colour" with `ui/ColorPicker`; saves on change, not with "Save" |
| FR-010 | `CardContent`: visually hidden text "Colour: <name>" inside the handle |
| Shared options | `features/colors/useColorOptions` (ids → translated names + CSS token); used by board and details through its `index.ts` |

## IPC contract change

- `setApplicationColor(id: string, color: CardColor | null): Promise<AppState>` —
  `VALIDATION` for an unknown colour, `NOT_FOUND` for an unknown id. Bumps
  `updatedAt` (data-model: any change to the application).
- `Application.color: CardColor | null`.
- MCP: no change. `summary()` and `details()` list their fields one by one, so the
  colour is not exposed; `update_application` does not touch the column.

## Database change

```sql
-- 002-card-color
ALTER TABLE applications ADD COLUMN color TEXT
  CHECK (color IS NULL OR color IN ('red','orange','yellow','green','blue','purple','grey'));
```

Schema version 2. The existing backup-before-migrate step covers the upgrade.

## Key decisions

### D-1 — A separate IPC call, not a field of `updateApplication`

- **Options considered:** add `color` to `ApplicationPatchSchema`; a new call.
- **Chosen:** a new call `setApplicationColor`.
- **Why:** the MCP tool `update_application` spreads `ApplicationPatchSchema.shape`,
  so a patch field would give MCP write access, which spec D-4 keeps out of scope.
  The menu also changes only the colour, so one small call fits it.

### D-2 — Tint with `color-mix` from one token per colour

- **Chosen:** tokens `--card-red` … `--card-grey` (light and dark values); the card
  background is `color-mix(in srgb, var(--card-<id>) 14%, var(--surface))` and the
  border is the token itself.
- **Why:** 7 tokens per theme instead of 21; the tint follows `--surface`, so text
  colours keep their contrast. axe in e2e checks the contrast in both themes.

## Risks

- **Muted text contrast on some tints in dark theme** → keep the mix low; axe checks
  every colour in both themes; raise `--fg-muted` contrast locally if needed.
- **Old Findy opens a v2 database** → existing rule: `newer_version` error state, the
  file is not changed (docs/contracts/database.md).
