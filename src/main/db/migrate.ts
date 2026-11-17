import type { Database } from 'better-sqlite3'
import { MIGRATIONS, type Migration } from './migrations'

export function getUserVersion(db: Database): number {
  return db.pragma('user_version', { simple: true }) as number
}

/**
 * Applies pending migrations in order, each in its own transaction (FR-053).
 * `backup` runs once before the first migration of an existing (non-empty) database.
 */
export function migrate(
  db: Database,
  backup: (fromVersion: number) => void,
  migrations: readonly Migration[] = MIGRATIONS,
): void {
  const current = getUserVersion(db)
  const pending = migrations.filter((migration) => migration.version > current)
  if (pending.length === 0) return

  if (current > 0) backup(current)

  for (const migration of pending) {
    db.transaction(() => {
      db.exec(migration.sql)
      db.pragma(`user_version = ${migration.version}`)
    })()
  }
}
