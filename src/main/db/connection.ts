import { copyFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import Database from 'better-sqlite3'
import { getUserVersion, migrate } from './migrate'
import { MIGRATIONS, type Migration } from './migrations'

export const DB_FILE_NAME = 'findy.db'

export interface OpenOptions {
  now?: () => Date
  migrations?: readonly Migration[]
}

export type StorageError = 'corrupt' | 'newer_version' | 'open_failed'

export type OpenResult =
  | { status: 'ok'; db: Database.Database; dataFilePath: string }
  | { status: 'error'; error: StorageError; dataFilePath: string; backupPath: string | null }

/** File-name-safe UTC timestamp, e.g. 2026-11-17T08-30-00-000Z */
export function fileStamp(now: Date): string {
  return now.toISOString().replace(/[:.]/g, '-')
}

function configure(db: Database.Database): void {
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('synchronous = NORMAL')
  db.pragma('busy_timeout = 5000')
}

function copyAside(filePath: string, suffix: string): string {
  const target = join(dirname(filePath), `findy.${suffix}.db`)
  copyFileSync(filePath, target)
  if (existsSync(`${filePath}-wal`)) copyFileSync(`${filePath}-wal`, `${target}-wal`)
  return target
}

/** Read-only health check that never modifies the file (FR-054). */
function inspect(filePath: string, schemaVersion: number): 'ok' | 'corrupt' | 'newer_version' {
  let db: Database.Database | undefined
  try {
    db = new Database(filePath, { readonly: true, fileMustExist: true })
    if (db.pragma('quick_check', { simple: true }) !== 'ok') return 'corrupt'
    return getUserVersion(db) > schemaVersion ? 'newer_version' : 'ok'
  } catch {
    return 'corrupt'
  } finally {
    db?.close()
  }
}

/**
 * Opens (or creates) the local database in `dir`, checks it and migrates it.
 * A damaged or too-new file is copied aside and never modified.
 */
export function openDatabase(
  dir: string,
  { now = () => new Date(), migrations = MIGRATIONS }: OpenOptions = {},
): OpenResult {
  const dataFilePath = join(dir, DB_FILE_NAME)

  if (existsSync(dataFilePath)) {
    const health = inspect(dataFilePath, migrations.length)
    if (health !== 'ok') {
      const backupPath = copyAside(dataFilePath, `corrupt-${fileStamp(now())}`)
      return { status: 'error', error: health, dataFilePath, backupPath }
    }
  }

  try {
    const db = new Database(dataFilePath)
    configure(db)
    migrate(
      db,
      (fromVersion) => {
        db.prepare('VACUUM INTO ?').run(
          join(dir, `findy.backup-v${fromVersion}-${fileStamp(now())}.db`),
        )
      },
      migrations,
    )
    return { status: 'ok', db, dataFilePath }
  } catch {
    return { status: 'error', error: 'open_failed', dataFilePath, backupPath: null }
  }
}
