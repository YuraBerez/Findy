import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { backupDatabase, DB_FILE_NAME, fileStamp, openDatabase } from '../../src/main/db/connection'
import { getUserVersion, migrate } from '../../src/main/db/migrate'
import { MIGRATIONS, SCHEMA_VERSION } from '../../src/main/db/migrations'
import { tempDir } from './helpers/db'

const fixedNow = () => new Date(Date.UTC(2026, 10, 17, 8, 30, 0))

describe('migrate (FR-053)', () => {
  it('migrates an empty database to the current version without a backup', () => {
    const db = new Database(':memory:')
    const backup = vi.fn()
    migrate(db, backup)
    expect(getUserVersion(db)).toBe(SCHEMA_VERSION)
    expect(backup).not.toHaveBeenCalled()
  })

  it('is a no-op when the schema is current', () => {
    const db = new Database(':memory:')
    migrate(db, () => {})
    const backup = vi.fn()
    migrate(db, backup)
    expect(backup).not.toHaveBeenCalled()
  })

  it('backs up once, then applies only pending migrations in order', () => {
    const db = new Database(':memory:')
    migrate(db, () => {})
    const backup = vi.fn()
    const next = [
      ...MIGRATIONS,
      { version: SCHEMA_VERSION + 1, name: 'a', sql: 'CREATE TABLE a (x INTEGER);' },
      { version: SCHEMA_VERSION + 2, name: 'b', sql: 'CREATE TABLE b (y INTEGER);' },
    ]
    migrate(db, backup, next)
    expect(backup).toHaveBeenCalledOnce()
    expect(backup).toHaveBeenCalledWith(SCHEMA_VERSION)
    expect(getUserVersion(db)).toBe(SCHEMA_VERSION + 2)
  })

  it('rolls back a failing migration', () => {
    const db = new Database(':memory:')
    migrate(db, () => {})
    const broken = [
      ...MIGRATIONS,
      { version: SCHEMA_VERSION + 1, name: 'bad', sql: 'CREATE TABLE ok (x); NOPE;' },
    ]
    expect(() => migrate(db, () => {}, broken)).toThrow()
    expect(getUserVersion(db)).toBe(SCHEMA_VERSION)
    expect(db.prepare("SELECT name FROM sqlite_master WHERE name = 'ok'").get()).toBeUndefined()
  })
})

describe('migration 002: card colour (spec 007 FR-011)', () => {
  const v1Row = `INSERT INTO applications (id, title, company, url, stage, position, created_at, updated_at)
    VALUES ('a', 'Dev', 'Acme', NULL, 'applied', 0, '2026-11-01T00:00:00.000Z', '2026-11-01T00:00:00.000Z')`

  it('keeps v1 rows and gives them no colour', () => {
    const db = new Database(':memory:')
    migrate(db, () => {}, MIGRATIONS.slice(0, 1))
    db.prepare(v1Row).run()

    migrate(db, () => {})

    expect(getUserVersion(db)).toBe(2)
    expect(db.prepare('SELECT title, color FROM applications').get()).toEqual({
      title: 'Dev',
      color: null,
    })
  })

  it('accepts only palette colours', () => {
    const db = new Database(':memory:')
    migrate(db, () => {})
    db.prepare(v1Row).run()
    db.prepare("UPDATE applications SET color = 'grey'").run()
    expect(() => db.prepare("UPDATE applications SET color = 'pink'").run()).toThrow(/CHECK/)
  })
})

describe('openDatabase (FR-051, FR-054)', () => {
  let dir: string
  let cleanup: () => void

  beforeEach(() => {
    ;({ dir, cleanup } = tempDir())
  })
  afterEach(() => cleanup())

  it('creates a new database with the current schema and WAL', () => {
    const result = openDatabase(dir, { now: fixedNow })
    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.dataFilePath).toBe(join(dir, DB_FILE_NAME))
    expect(getUserVersion(result.db)).toBe(SCHEMA_VERSION)
    expect(result.db.pragma('journal_mode', { simple: true })).toBe('wal')
    expect(result.db.pragma('foreign_keys', { simple: true })).toBe(1)
    result.db.close()
  })

  it('reopens an existing database', () => {
    const first = openDatabase(dir, { now: fixedNow })
    if (first.status !== 'ok') throw new Error('expected ok')
    first.db.prepare("INSERT INTO settings VALUES ('language', 'uk')").run()
    first.db.close()

    const second = openDatabase(dir, { now: fixedNow })
    if (second.status !== 'ok') throw new Error('expected ok')
    expect(second.db.prepare('SELECT value FROM settings').get()).toEqual({ value: 'uk' })
    second.db.close()
  })

  it('does not touch a file that is not a database and keeps a copy', () => {
    const file = join(dir, DB_FILE_NAME)
    writeFileSync(file, 'this is not sqlite')

    const result = openDatabase(dir, { now: fixedNow })

    expect(result).toMatchObject({ status: 'error', error: 'corrupt', dataFilePath: file })
    expect(readFileSync(file, 'utf8')).toBe('this is not sqlite')
    const backup = join(dir, `findy.corrupt-${fileStamp(fixedNow())}.db`)
    expect(result.status === 'error' && result.backupPath).toBe(backup)
    expect(readFileSync(backup, 'utf8')).toBe('this is not sqlite')
  })

  it('refuses a database from a newer app version', () => {
    const file = join(dir, DB_FILE_NAME)
    const db = new Database(file)
    db.pragma(`user_version = ${SCHEMA_VERSION + 1}`)
    db.close()

    const result = openDatabase(dir, { now: fixedNow })

    expect(result).toMatchObject({ status: 'error', error: 'newer_version' })
    const check = new Database(file, { readonly: true })
    expect(getUserVersion(check)).toBe(SCHEMA_VERSION + 1)
    check.close()
  })

  it('copies the WAL file with a corrupt database', () => {
    const file = join(dir, DB_FILE_NAME)
    writeFileSync(file, 'garbage')
    writeFileSync(`${file}-wal`, 'wal')
    const result = openDatabase(dir, { now: fixedNow })
    expect(result.status === 'error' && existsSync(`${result.backupPath}-wal`)).toBe(true)
  })

  it('backs up with VACUUM INTO before migrating an older database', () => {
    const v1 = openDatabase(dir, { now: fixedNow, migrations: MIGRATIONS.slice(0, 1) })
    if (v1.status !== 'ok') throw new Error('expected ok')
    v1.db.prepare("INSERT INTO settings VALUES ('theme', 'dark')").run()
    v1.db.close()

    const result = openDatabase(dir, { now: fixedNow })
    if (result.status !== 'ok') throw new Error('expected ok')
    expect(getUserVersion(result.db)).toBe(SCHEMA_VERSION)
    result.db.close()

    const backup = join(dir, `findy.backup-v1-${fileStamp(fixedNow())}.db`)
    const copy = new Database(backup, { readonly: true })
    expect(getUserVersion(copy)).toBe(1)
    expect(copy.prepare('SELECT value FROM settings').get()).toEqual({ value: 'dark' })
    copy.close()
  })

  it('reports open_failed when the directory does not exist', () => {
    const result = openDatabase(join(dir, 'missing', 'nested'), { now: fixedNow })
    expect(result).toMatchObject({ status: 'error', error: 'open_failed', backupPath: null })
  })
})

describe('backupDatabase (FR-092)', () => {
  it('copies the open database with a label and time', () => {
    const { dir, cleanup } = tempDir()
    const opened = openDatabase(dir, { now: fixedNow })
    if (opened.status !== 'ok') throw new Error('expected ok')
    opened.db.prepare("INSERT INTO settings VALUES ('theme', 'dark')").run()

    const path = backupDatabase(opened.db, dir, 'reset', fixedNow)

    expect(path).toBe(join(dir, `findy.backup-reset-${fileStamp(fixedNow())}.db`))
    const copy = new Database(path, { readonly: true })
    expect(copy.prepare('SELECT value FROM settings').get()).toEqual({ value: 'dark' })
    copy.close()
    opened.db.close()
    cleanup()
  })
})
