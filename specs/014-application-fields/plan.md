# Implementation Plan: More application fields

- **Spec:** [spec.md](spec.md) · **Architecture:** [docs/architecture.md](../../docs/architecture.md)
- **Status:** Approved

## Summary

Migration 004 adds nullable columns to `applications` for the salary, the work format,
the location, the source and the contact. The rules live in a new pure module
`domain/fields/` (types, validation, the source of a link, source text from CSV and MCP).
`createApplication` and `updateApplication` get the new optional fields, so the MCP tools
get them through the shared schemas. The repository fills in the source from the link,
so the app, CSV import and MCP use one rule. The details panel gets a "Details" group in
the same form as the other fields; the card gets one short line. No new dependency.

## Technical context

| Item | Choice |
|------|--------|
| Language | TypeScript (strict) |
| Storage | 10 nullable columns on `applications` (migration 004), CHECK per column |
| Validation | zod in main (`domain/schema.ts`), zod-free form rules in `domain/fields/` (renderer CSP, D-6) |
| Formatting | `Intl.NumberFormat` with `style: 'currency'` and `formatRange` for the card line |
| Testing | Vitest: domain, migration, repository, IPC, MCP tools, CSV; e2e for US-1…US-5 |
| Target platforms | Windows, macOS, Linux (no platform code) |

## Constitution check

| Principle | Complies? | Notes |
|-----------|-----------|-------|
| I. Spec first | ✅ | Spec 014, approved 2026-11-21 |
| II. Local-first | ✅ | Local columns only; the source comes from the link text, no request |
| III. Secure Electron | ✅ | New IPC fields parsed with zod in main; contact links open through `openExternal` (http/https only) |
| IV. Cross-platform | ✅ | SQL, CSS and `Intl` only |
| V. i18n | ✅ | Labels, work formats, periods, channels, errors in en + uk; numbers and currencies through `Intl` |
| VI. Tested | ✅ | Unit for every new rule; e2e for every acceptance scenario |
| VII. Simplicity | ✅ | Columns on the existing table, no new table; one source rule in the repository |
| VIII. Accessible | ✅ | Every control through `Field` (label, error, ARIA); the card line is text inside the handle |

## Data model

```ts
type Currency = 'USD' | 'EUR' | 'UAH' | 'GBP' | 'PLN'
type SalaryPeriod = 'month' | 'year'
type WorkFormat = 'remote' | 'office' | 'hybrid'
type SourceChannel = 'referral' | 'company_site' | 'recruiter' | 'other'

interface Salary { min: number | null; max: number | null; currency: Currency; period: SalaryPeriod }
type ApplicationSource =
  | { kind: 'site'; id: KnownSiteId }
  | { kind: 'custom'; name: string }       // FR-005: the name, not the site id
  | { kind: 'channel'; id: SourceChannel }

interface Application {                    // new fields, all nullable
  salary: Salary | null                    // null: no amount (FR-003)
  workFormat: WorkFormat | null
  location: string | null
  source: ApplicationSource | null
  contactName: string | null
  contactDetails: string | null
}
```

`salary` and `source` are whole values: a patch replaces them or sets `null`, so a
patch never leaves a half salary (FR-002, FR-003).

## Database change

```sql
-- 004-application-fields
ALTER TABLE applications ADD COLUMN salary_min INTEGER CHECK (salary_min IS NULL OR salary_min BETWEEN 0 AND 1000000000);
ALTER TABLE applications ADD COLUMN salary_max INTEGER CHECK (salary_max IS NULL OR salary_max BETWEEN 0 AND 1000000000);
ALTER TABLE applications ADD COLUMN salary_currency TEXT CHECK (salary_currency IS NULL OR salary_currency IN ('USD','EUR','UAH','GBP','PLN'));
ALTER TABLE applications ADD COLUMN salary_period TEXT CHECK (salary_period IS NULL OR salary_period IN ('month','year'));
ALTER TABLE applications ADD COLUMN work_format TEXT CHECK (work_format IS NULL OR work_format IN ('remote','office','hybrid'));
ALTER TABLE applications ADD COLUMN location TEXT CHECK (location IS NULL OR length(location) BETWEEN 1 AND 100);
ALTER TABLE applications ADD COLUMN source_kind TEXT CHECK (source_kind IS NULL OR source_kind IN ('site','custom','channel'));
ALTER TABLE applications ADD COLUMN source_value TEXT CHECK (source_value IS NULL OR length(source_value) BETWEEN 1 AND 60);
ALTER TABLE applications ADD COLUMN contact_name TEXT CHECK (contact_name IS NULL OR length(contact_name) BETWEEN 1 AND 100);
ALTER TABLE applications ADD COLUMN contact_details TEXT CHECK (contact_details IS NULL OR length(contact_details) BETWEEN 1 AND 200);
```

Schema version 4. Old rows get `NULL` everywhere (FR-001). The rules across columns
(FR-002, FR-003) stay in zod: `ADD COLUMN` cannot add a table CHECK. A row with a
`source_value` that this version does not know (a known site removed in a later
version) reads as `source: null`.

## IPC contract change

- `createApplication(input)` and `updateApplication(id, patch)` accept the optional
  fields `salary`, `workFormat`, `location`, `source`, `contactName`, `contactDetails`.
  In a patch, `null` clears a field and a missing field stays as it is.
- `Application` gets the six fields.
- No new channel.

## MCP change

- `summary()` and `details()` return the six fields. `source` goes out as its display
  name (`"Djinni"`, `"Referral"`, the custom name).
- `add_application` and `update_application` accept the fields. `source` is a string:
  a known site id or name, a channel id or English name, else a custom name. The same
  parser reads the CSV column (FR-042).
- `list_applications` → `query` also matches the FR-040 fields (the shared
  `matchesQuery`).

## Requirement → component map

| Requirements | Where |
|--------------|-------|
| FR-001…FR-003 | `domain/fields/` (`types.ts`, `validate.ts`: zod-free form rules), `domain/limits.ts` (lengths), `domain/schema.ts` (`SalarySchema`, `SourceSchema`, input and patch fields) |
| FR-001, FR-004, NFR-004 | Migration `004-application-fields`; `rows.ts` mapping; `ApplicationStore.create/update/importMany` write the columns; `updatedAt` only |
| FR-005 | `ApplicationSource.custom` keeps the name; the sites store is not read for display |
| FR-020…FR-022 | `domain/fields/source.ts#sourceFromUrl(url, customSites)` (uses `siteHost`); `ApplicationStore` calls it in `create`, `update` and `importMany` when the source is empty |
| FR-010…FR-013 | `features/applications/ApplicationExtraFields/` in the details form; `useApplicationForm` holds the extra values; `domain/forms.ts` validates them; currency default from the state (`defaultCurrency`) |
| US-4.2 | Contact details that are an http(s) link get an "Open" button → `openExternal` |
| FR-030…FR-032 | `features/board/Card` line; `renderer/format.ts#formatSalary`, `features/fields/useFieldLabels` (work format, period, channel names) |
| FR-040 | `domain/search.ts#matchesQuery` also checks location, source name, contact |
| FR-041…FR-043 | `domain/transfer/columns.ts` (+9 columns, labels), `export.ts`, `import.ts` (`parseSourceText`, amounts, codes); `main/transfer.ts` labels from locales |
| FR-044 | `main/mcp/tools.ts` |
| NFR-001 | `locales/en.json`, `locales/uk.json` |

## Key decisions

### D-1 — Columns on `applications`, not a new table

- **Options considered:** columns on `applications`; a key-value table of fields.
- **Chosen:** columns.
- **Why:** fixed fields with fixed rules; CHECK constraints per column; one row read
  per application, as today (constitution §VII).

### D-2 — The source rule in the repository

- **Options considered:** fill in the source in the renderer form; in the repository.
- **Chosen:** the repository, with a pure `sourceFromUrl` in the domain.
- **Why:** FR-022 needs the same rule for the app, CSV import and MCP. The repository
  is the one place that all three use, and it can read the custom sites.

### D-3 — The source as a kind and a value

- **Chosen:** `source_kind` + `source_value`; a custom source keeps only the name.
- **Why:** FR-005 asks the application to keep the name after the site is deleted or
  renamed, so the custom-site id is not needed. Two columns keep the known site ids
  apart from custom names that look like an id.

### D-4 — One string format for the source in CSV and MCP

- **Chosen:** `parseSourceText`: known site id or name, channel id or name (en, uk),
  else a custom name.
- **Why:** a person types "Djinni" in a spreadsheet and a model writes "LinkedIn"; one
  parser serves both and needs no ids.

## Risks

- **`formatRange` output differs by locale** ("$3,000 – $4,000" in en) → the spec
  shows an example only; e2e checks the numbers and the en dash, not exact spacing.
- **The card gets taller** → one line, ellipsis on overflow; the e2e performance spec
  with 1 000 cards stays green.
- **Old Findy opens a v4 database** → the existing `newer_version` error state; the
  file is not changed (docs/contracts/database.md).
