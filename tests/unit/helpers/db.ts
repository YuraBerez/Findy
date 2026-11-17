import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { migrate } from '../../../src/main/db/migrate'
import { Repository } from '../../../src/main/db/repository'

export function tempDir(): { dir: string; cleanup(): void } {
  const dir = mkdtempSync(join(tmpdir(), 'findy-test-'))
  return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) }
}

/** In-memory database with the full schema and a deterministic clock and ids. */
export function memoryRepository(): { db: Database.Database; repository: Repository } {
  const db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  migrate(db, () => {})
  let tick = 0
  let id = 0
  const repository = new Repository(db, {
    now: () => new Date(Date.UTC(2026, 10, 17, 9, 0, tick++)).toISOString(),
    newId: () => `00000000-0000-4000-8000-${String(++id).padStart(12, '0')}`,
  })
  return { db, repository }
}
