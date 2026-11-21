// Schema v5 (spec 015): the next step of an application, in local wall-clock time.
// Never edit after release; add a new migration.
export default `
ALTER TABLE applications ADD COLUMN next_step_text TEXT
  CHECK (next_step_text IS NULL OR length(next_step_text) BETWEEN 1 AND 200);
ALTER TABLE applications ADD COLUMN next_step_date TEXT
  CHECK (next_step_date IS NULL OR next_step_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]');
ALTER TABLE applications ADD COLUMN next_step_time TEXT
  CHECK (next_step_time IS NULL OR next_step_time GLOB '[0-2][0-9]:[0-5][0-9]');
`
