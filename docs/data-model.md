# Data model

- **Introduced by:** [specs/001-mvp-board](../specs/001-mvp-board/spec.md) · **Architecture:** [architecture.md](architecture.md)

All timestamps are UTC ISO-8601 strings (`2026-11-17T08:30:00.000Z`).
All ids are UUID v4 strings.

## StageId

```ts
type StageId =
  | 'applied'
  | 'hr_interview'
  | 'test_task'
  | 'technical_interview'
  | 'c_level_interview'
  | 'offered'
  | 'rejected';
```

The order of stages on the board is defined in code (`STAGES` constant), not in
user data. Labels come from locale files (`stages.<id>`).

## Application

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `id` | string (uuid) | yes | immutable |
| `title` | string | yes | trimmed, 1–200 chars |
| `company` | string | yes | trimmed, 1–200 chars |
| `url` | string \| null | no | `http:`/`https:` only, ≤ 2048 chars |
| `stage` | StageId | yes | |
| `order` | number | yes | position within the stage column; lower = higher on screen (DB column `position`) |
| `stageHistory` | StageChange[] | yes | ≥ 1 entry; last entry's `stage` equals `stage` |
| `notes` | Note[] | yes | may be empty |
| `createdAt` | timestamp | yes | immutable |
| `updatedAt` | timestamp | yes | ≥ `createdAt`; bumped on any change to the application or its notes |

## StageChange

| Field | Type | Rules |
|-------|------|-------|
| `stage` | StageId | |
| `at` | timestamp | non-decreasing within `stageHistory` |

A new entry is appended only when `stage` actually changes. Reordering within a
column does not add history.

## Note

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `id` | string (uuid) | yes | immutable |
| `text` | string | yes | trimmed, 1–10 000 chars, line breaks preserved |
| `createdAt` | timestamp | yes | immutable |
| `updatedAt` | timestamp \| null | no | set on edit; `null` if never edited |

## Settings

| Field | Type | Default | Rules |
|-------|------|---------|-------|
| `language` | `'en' \| 'uk'` \| null | `null` | `null` = not chosen yet → derive from OS locale (FR-041) |
| `theme` | `'system' \| 'light' \| 'dark'` | `'system'` | FR-080…083 |
| `mcpEnabled` | `boolean` | `false` | Spec 004: AI assistants may use the board through MCP; row `mcpEnabled` (`'true'`/`'false'`) |
| `hiddenStages` | `StageId[]` | `[]` | Spec 002: unique, never all stages; stored as a JSON array in the `settings` row `hiddenStages` |
| `analytics` | `{ period: '7d' \| '30d' \| '90d' \| 'all'; grouping: 'day' \| 'week' \| 'month' }` | `{ period: '30d', grouping: 'day' }` | Spec 005: the view of the analytics screen; a JSON object in the `settings` row `analytics`; an invalid value reads as the default |

## Invariants

1. `id`s are unique across applications; note `id`s are unique within the file.
2. Within one stage, `order` values are unique. Implementation renormalises to
   `0, 1, 2…` after every move.
3. The "how long in current stage" value (FR-003) is derived from the last
   `stageHistory` entry — it is never stored.

## Storage

Entities are stored in the local SQLite database; tables, columns and
constraints are defined in [contracts/database.md](contracts/database.md).
`Application.stageHistory` and `Application.notes` are loaded from the
`stage_changes` and `notes` tables. `Settings` are rows in `settings`.
