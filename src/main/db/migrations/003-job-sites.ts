// Schema v3 (spec 011): the user's job sites and saved site icons. Never edit after
// release; add a new migration.
export default `
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
`
