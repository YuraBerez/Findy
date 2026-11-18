// Schema v2 (spec 007): a card colour. Never edit after release; add a new migration.
export default `
ALTER TABLE applications ADD COLUMN color TEXT
  CHECK (color IS NULL OR color IN ('red','orange','yellow','green','blue','purple','grey'));
`
