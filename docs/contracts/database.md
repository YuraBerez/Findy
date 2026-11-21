# Contract: local database

Findy stores all user data in a local **SQLite** database owned by the main
process (architecture D-2). There is no server; the database is a single file
on the user's machine.

- **Engine:** SQLite 3 via [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3)
  (synchronous, runs in the main process only).
- **Location:** `<userData>/findy.db`, where `<userData>` is `app.getPath('userData')`:
  - Windows: `%APPDATA%\Findy\findy.db`
  - macOS: `~/Library/Application Support/Findy/findy.db`
  - Linux: `~/.config/Findy/findy.db`
- **Connection pragmas:** `journal_mode = WAL`, `foreign_keys = ON`,
  `synchronous = NORMAL`, `busy_timeout = 5000`.

## Schema (version 2)

```sql
CREATE TABLE applications (
  id          TEXT PRIMARY KEY,                        -- uuid v4
  title       TEXT NOT NULL CHECK (length(title)   BETWEEN 1 AND 200),
  company     TEXT NOT NULL CHECK (length(company) BETWEEN 1 AND 200),
  url         TEXT          CHECK (url IS NULL OR length(url) <= 2048),
  stage       TEXT NOT NULL CHECK (stage IN ('applied','hr_interview','test_task',
                                   'technical_interview','c_level_interview','offered','rejected')),
  position    INTEGER NOT NULL,                        -- order within stage, 0 = top
  color       TEXT          CHECK (color IS NULL OR color IN
                            ('red','orange','yellow','green','blue','purple','grey')),  -- v2, spec 007
  created_at  TEXT NOT NULL,                           -- UTC ISO-8601
  updated_at  TEXT NOT NULL
);
CREATE INDEX idx_applications_stage_position ON applications(stage, position);

CREATE TABLE stage_changes (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id  TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  stage           TEXT NOT NULL,
  at              TEXT NOT NULL
);
CREATE INDEX idx_stage_changes_app ON stage_changes(application_id, at);

CREATE TABLE notes (
  id              TEXT PRIMARY KEY,                    -- uuid v4
  application_id  TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  text            TEXT NOT NULL CHECK (length(text) BETWEEN 1 AND 10000),
  created_at      TEXT NOT NULL,
  updated_at      TEXT                                 -- NULL = never edited
);
CREATE INDEX idx_notes_app ON notes(application_id, created_at DESC);

CREATE TABLE settings (
  key    TEXT PRIMARY KEY,                             -- one row per setting: see data-model.md → Settings
  value  TEXT NOT NULL
);
```

Version 2 (`002-card-color`, spec 007) adds `applications.color` with `ALTER TABLE …
ADD COLUMN`; rows from version 1 get `NULL` (no colour). In version 2 databases the
column is the last one of `applications`.

Version 3 (`003-job-sites`, spec 011) adds two tables:

```sql
CREATE TABLE job_sites (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 60),
  url        TEXT NOT NULL CHECK (length(url) BETWEEN 1 AND 2048),
  position   INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE site_icons (
  host       TEXT PRIMARY KEY,
  mime       TEXT,
  data       BLOB,
  status     TEXT NOT NULL CHECK (status IN ('ok', 'failed')),
  checked_at TEXT NOT NULL
);
```

A board reset does not touch them. Findy 0.3.0 cannot open a version 3 database (it
shows the "newer version" error and leaves the file as it is).

Version 4 (`004-application-fields`, spec 014) adds nullable columns to `applications`
with `ALTER TABLE … ADD COLUMN`; rows from version 3 get `NULL`:

```sql
salary_min      INTEGER CHECK (salary_min IS NULL OR salary_min BETWEEN 0 AND 1000000000),
salary_max      INTEGER CHECK (salary_max IS NULL OR salary_max BETWEEN 0 AND 1000000000),
salary_currency TEXT    CHECK (salary_currency IS NULL OR salary_currency IN ('USD','EUR','UAH','GBP','PLN')),
salary_period   TEXT    CHECK (salary_period IS NULL OR salary_period IN ('month','year')),
work_format     TEXT    CHECK (work_format IS NULL OR work_format IN ('remote','office','hybrid')),
location        TEXT    CHECK (location IS NULL OR length(location) BETWEEN 1 AND 100),
source_kind     TEXT    CHECK (source_kind IS NULL OR source_kind IN ('site','custom','channel')),
source_value    TEXT    CHECK (source_value IS NULL OR length(source_value) BETWEEN 1 AND 60),
contact_name    TEXT    CHECK (contact_name IS NULL OR length(contact_name) BETWEEN 1 AND 100),
contact_details TEXT    CHECK (contact_details IS NULL OR length(contact_details) BETWEEN 1 AND 200)
```

The rules across columns (`salary_min ≤ salary_max`, currency and period only with an
amount) are checked in main before the write. A `source_value` that this version does
not know reads as no source.

Version 5 (`005-next-step`, spec 015) adds the next step to `applications`; rows from
version 4 get `NULL` (no step):

```sql
next_step_text TEXT CHECK (next_step_text IS NULL OR length(next_step_text) BETWEEN 1 AND 200),
next_step_date TEXT CHECK (next_step_date IS NULL OR next_step_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
next_step_time TEXT CHECK (next_step_time IS NULL OR next_step_time GLOB '[0-2][0-9]:[0-5][0-9]')
```

Text and date are set together, and a time needs a date. Main checks this before the
write; a row that breaks it reads as no step.

Column ↔ entity mapping is in [data-model.md](../data-model.md)
(`position` ↔ `order`, snake_case ↔ camelCase).

## Writes (FR-050, FR-052)

- Every IPC mutation runs inside **one transaction** (`db.transaction(...)`),
  e.g. moving a card = update stage + renumber positions in source and target
  columns + insert `stage_changes` row. A crash mid-write rolls back; the
  database is never left half-updated.
- Changes are committed immediately; there is no "Save" step.

## Reset (FR-092, FR-093)

`resetBoard` first copies the database with `VACUUM INTO
'findy.backup-reset-<timestamp>.db'`, then deletes all rows of `applications` in
one transaction (`notes` and `stage_changes` go by `ON DELETE CASCADE`).
`settings` is not touched.

## Migrations (FR-053)

- Schema version is stored in `PRAGMA user_version`.
- Migrations live in `src/main/db/migrations/NNN-name.ts` (SQL in a template string), listed in `migrations/index.ts`, applied
  in order inside a transaction at startup.
- Before applying any migration, the file is copied to
  `findy.backup-v<old>-<timestamp>.db`.
- Every migration has a unit test that migrates a fixture database.

## Startup & corruption (FR-054)

1. File missing → create it and apply all migrations.
2. File present → open, run `PRAGMA quick_check`.
3. `user_version` lower than current → back up, migrate.
4. `user_version` higher than current (created by a newer Findy),
   `quick_check` fails, or the file is not a SQLite database →
   copy it to `findy.corrupt-<timestamp>.db`, **do not modify the original**,
   start in an error state showing the file path.

## Portability

SQLite is an open, documented, widely supported format: users can inspect or
export their data with any SQLite tool (e.g. DB Browser for SQLite, `sqlite3` CLI).
Any schema change requires a new migration; changing a released migration is
forbidden.
