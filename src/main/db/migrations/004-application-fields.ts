// Schema v4 (spec 014): salary, work format, location, source and contact of an
// application. Never edit after release; add a new migration.
export default `
ALTER TABLE applications ADD COLUMN salary_min INTEGER
  CHECK (salary_min IS NULL OR salary_min BETWEEN 0 AND 1000000000);
ALTER TABLE applications ADD COLUMN salary_max INTEGER
  CHECK (salary_max IS NULL OR salary_max BETWEEN 0 AND 1000000000);
ALTER TABLE applications ADD COLUMN salary_currency TEXT
  CHECK (salary_currency IS NULL OR salary_currency IN ('USD','EUR','UAH','GBP','PLN'));
ALTER TABLE applications ADD COLUMN salary_period TEXT
  CHECK (salary_period IS NULL OR salary_period IN ('month','year'));
ALTER TABLE applications ADD COLUMN work_format TEXT
  CHECK (work_format IS NULL OR work_format IN ('remote','office','hybrid'));
ALTER TABLE applications ADD COLUMN location TEXT
  CHECK (location IS NULL OR length(location) BETWEEN 1 AND 100);
ALTER TABLE applications ADD COLUMN source_kind TEXT
  CHECK (source_kind IS NULL OR source_kind IN ('site','custom','channel'));
ALTER TABLE applications ADD COLUMN source_value TEXT
  CHECK (source_value IS NULL OR length(source_value) BETWEEN 1 AND 60);
ALTER TABLE applications ADD COLUMN contact_name TEXT
  CHECK (contact_name IS NULL OR length(contact_name) BETWEEN 1 AND 100);
ALTER TABLE applications ADD COLUMN contact_details TEXT
  CHECK (contact_details IS NULL OR length(contact_details) BETWEEN 1 AND 200);
`
