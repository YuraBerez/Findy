import init from './001-init'
import cardColor from './002-card-color'

export interface Migration {
  version: number
  name: string
  sql: string
}

// Append only. `version` must equal the position in this list + 1.
export const MIGRATIONS: readonly Migration[] = [
  { version: 1, name: 'init', sql: init },
  { version: 2, name: 'card-color', sql: cardColor },
]

export const SCHEMA_VERSION = MIGRATIONS.length
