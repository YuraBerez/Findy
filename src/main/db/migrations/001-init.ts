// Schema v1: docs/contracts/database.md. Never edit after release; add a new migration.
export default `
CREATE TABLE applications (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL CHECK (length(title)   BETWEEN 1 AND 200),
  company     TEXT NOT NULL CHECK (length(company) BETWEEN 1 AND 200),
  url         TEXT          CHECK (url IS NULL OR length(url) <= 2048),
  stage       TEXT NOT NULL CHECK (stage IN ('applied','hr_interview','test_task',
                                   'technical_interview','c_level_interview','offered','rejected')),
  position    INTEGER NOT NULL,
  created_at  TEXT NOT NULL,
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
  id              TEXT PRIMARY KEY,
  application_id  TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  text            TEXT NOT NULL CHECK (length(text) BETWEEN 1 AND 10000),
  created_at      TEXT NOT NULL,
  updated_at      TEXT
);
CREATE INDEX idx_notes_app ON notes(application_id, created_at DESC);

CREATE TABLE settings (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL
);
`
