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
| `color` | CardColor \| null | yes | Spec 007: `null` = no colour (default); a change bumps `updatedAt`, adds no `stageHistory` entry and keeps `order` |
| `salary` | Salary \| null | yes | Spec 014: `null` = no amount; replaced as a whole |
| `workFormat` | `'remote' \| 'office' \| 'hybrid'` \| null | yes | Spec 014 |
| `location` | string \| null | yes | Spec 014: trimmed, 1–100 chars |
| `source` | ApplicationSource \| null | yes | Spec 014: set from the link when empty (FR-020) |
| `contactName` | string \| null | yes | Spec 014: trimmed, 1–100 chars |
| `contactDetails` | string \| null | yes | Spec 014: trimmed, 1–200 chars, free text |
| `nextStep` | NextStep \| null | yes | Spec 015: replaced as a whole; a change bumps `updatedAt`, adds no `stageHistory` entry and keeps `order`; a move keeps it |
| `stageHistory` | StageChange[] | yes | ≥ 1 entry; last entry's `stage` equals `stage` |
| `notes` | Note[] | yes | may be empty |
| `createdAt` | timestamp | yes | immutable |
| `updatedAt` | timestamp | yes | ≥ `createdAt`; bumped on any change to the application or its notes |

## CardColor

```ts
type CardColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'grey';
```

Spec 007. The order is the palette order (`CARD_COLORS`). Names come from locale files
(`colors.<id>`); the on-screen colour comes from the theme tokens `--card-<id>`.

## Salary (spec 014)

| Field | Type | Rules |
|-------|------|-------|
| `min` | number \| null | whole number 0–1 000 000 000 |
| `max` | number \| null | whole number 0–1 000 000 000; `min ≤ max` when both are set |
| `currency` | `'USD' \| 'EUR' \| 'UAH' \| 'GBP' \| 'PLN'` | |
| `period` | `'month' \| 'year'` | |

At least one of `min` and `max` is set. With no amount, `Application.salary` is `null`.

## ApplicationSource (spec 014)

```ts
type ApplicationSource =
  | { kind: 'site'; id: KnownSiteId }                                      // a known job site
  | { kind: 'custom'; name: string }                                        // 1–60 chars; the name only (FR-005)
  | { kind: 'channel'; id: 'referral' | 'company_site' | 'recruiter' | 'other' };
```

A change to a custom site does not change the applications that use its name.

## NextStep (spec 015)

| Field | Type | Rules |
|-------|------|-------|
| `text` | string | trimmed, 1–200 chars, one line |
| `date` | string | local calendar date `YYYY-MM-DD` (not UTC) |
| `time` | string \| null | local wall-clock time `HH:MM`, 00:00–23:59; `null` = all day |

The status ("overdue", "today", "tomorrow", later) is computed from the local clock,
never stored. "Done" removes the step and adds a note "Done: <text> (<date>[, <time>])".

## StageChange

| Field | Type | Rules |
|-------|------|-------|
| `stage` | StageId | |
| `at` | timestamp | non-decreasing within `stageHistory` |

A new entry is appended only when `stage` actually changes. Reordering within a
column does not add history.

Spec 021: the user can delete an entry, but not the only one. After a delete, equal
neighbours merge into the earlier entry. If the last entry changes, `stage` follows it
and the card goes to the top of that column. A delete bumps `updatedAt` and adds no entry.

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
| `autoUpdateCheck` | `boolean` | `false` | Spec 006: check for a newer version at start, at most once per 24 h; row `autoUpdateCheck` (`'true'`/`'false'`). The row `lastUpdateCheckAt` (timestamp of the last check) is internal to main and not part of `Settings` |
| `staleAfterDays` | `number` | `14` | Spec 010: an application is stale after more than this many whole days in its stage (not Offer or Rejected); a whole number 3–90 in the row `staleAfterDays`; an invalid value reads as 14. "Stale" itself is computed, never stored |
| `hiddenSites` | `KnownSiteId[]` | `[]` | Spec 011: known job sites the user hid; a JSON array in the row `hiddenSites`; ids that a later version does not know are dropped |
| `siteQuery` | `string` | `''` | Spec 011 FR-005: the search query of the Sites tab, trimmed, ≤ 200 characters; row `siteQuery` |
| `offerQuestionAnswered` | `boolean` | `false` | Spec 013 FR-004: the question after an offer has a final answer and is never asked again; row `offerQuestionAnswered` (`'true'`); another value reads as `false`. The answer itself is not stored |
| `remindersEnabled` | `boolean` | `true` | Spec 015 FR-030: system notifications about next steps; row `remindersEnabled`, only `'false'` turns them off; a board reset does not change it |
| `analytics` | `{ period: '7d' \| '30d' \| '90d' \| 'all'; grouping: 'day' \| 'week' \| 'month' }` | `{ period: '30d', grouping: 'day' }` | Spec 005: the view of the analytics screen; a JSON object in the `settings` row `analytics`; an invalid value reads as the default |

## CustomSite (spec 011)

A job site the user added. The known sites are a constant list in code
(`domain/sites/known.ts`), not data.

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `id` | UUID | yes | |
| `name` | string | yes | trimmed, 1–60 characters |
| `url` | string | yes | `http`/`https`, ≤ 2 048; may hold `{query}` once, not in the host |

At most 50; listed in the order they were added (table `job_sites`, `position`).

## SiteIcon (spec 011)

The saved icon of a site host (table `site_icons`), main only; the renderer gets
`data:` URLs. `status` is `ok` (with `mime` and `data`: PNG, ICO, JPEG, GIF or WebP,
≤ 100 KB) or `failed` (tried again after 24 h); `checked_at` is the last try. A board
reset touches neither table.

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
