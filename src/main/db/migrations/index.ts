import init from './001-init'
import cardColor from './002-card-color'
import jobSites from './003-job-sites'
import applicationFields from './004-application-fields'

export interface Migration {
  version: number
  name: string
  sql: string
}

// Append only. `version` must equal the position in this list + 1.
export const MIGRATIONS: readonly Migration[] = [
  { version: 1, name: 'init', sql: init },
  { version: 2, name: 'card-color', sql: cardColor },
  { version: 3, name: 'job-sites', sql: jobSites },
  { version: 4, name: 'application-fields', sql: applicationFields },
]

export const SCHEMA_VERSION = MIGRATIONS.length
