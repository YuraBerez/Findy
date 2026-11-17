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

## Schema (version 1)

```sql
CREATE TABLE applications (
  id          TEXT PRIMARY KEY,                        -- uuid v4
  title       TEXT NOT NULL CHECK (length(title)   BETWEEN 1 AND 200),
  company     TEXT NOT NULL CHECK (length(company) BETWEEN 1 AND 200),
  url         TEXT          CHECK (url IS NULL OR length(url) <= 2048),
  stage       TEXT NOT NULL CHECK (stage IN ('applied','hr_interview','test_task',
                                   'technical_interview','c_level_interview','offered','rejected')),
  position    INTEGER NOT NULL,                        -- order within stage, 0 = top
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
  key    TEXT PRIMARY KEY,                             -- e.g. 'language'
  value  TEXT NOT NULL
);
```

Column ↔ entity mapping is in [data-model.md](../data-model.md)
(`position` ↔ `order`, snake_case ↔ camelCase).

## Writes (FR-050, FR-052)

- Every IPC mutation runs inside **one transaction** (`db.transaction(...)`),
  e.g. moving a card = update stage + renumber positions in source and target
  columns + insert `stage_changes` row. A crash mid-write rolls back; the
  database is never left half-updated.
- Changes are committed immediately; there is no "Save" step.

## Migrations (FR-053)

- Schema version is stored in `PRAGMA user_version`.
- Migrations live in `src/main/db/migrations/NNN-name.sql` (or `.ts`), applied
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
