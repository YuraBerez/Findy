import { randomUUID } from 'node:crypto'
import Database from 'better-sqlite3'
import { STAGES } from '../../src/domain/stages'
import { migrate } from '../../src/main/db/migrate'

export interface BulkData {
  applications: number
  notesEach: number
}

/**
 * Writes a database file straight to disk before the app starts (NFR-002): going
 * through IPC would take minutes, because every call returns the whole state.
 */
export function writeBulkDatabase(file: string, { applications, notesEach }: BulkData): void {
  const db = new Database(file)
  db.pragma('journal_mode = WAL')
  migrate(db, () => {})
  const day = 86_400_000
  const insertApp = db.prepare(
    'INSERT INTO applications (id, title, company, url, stage, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  )
  const insertChange = db.prepare(
    'INSERT INTO stage_changes (application_id, stage, at) VALUES (?, ?, ?)',
  )
  const insertNote = db.prepare(
    'INSERT INTO notes (id, application_id, text, created_at, updated_at) VALUES (?, ?, ?, ?, NULL)',
  )
  const positions = new Map<string, number>()
  db.transaction(() => {
    for (let i = 0; i < applications; i++) {
      const stage = STAGES[i % STAGES.length]!
      const position = positions.get(stage) ?? 0
      positions.set(stage, position + 1)
      const id = randomUUID()
      const at = new Date(Date.now() - (i % 30) * day).toISOString()
      insertApp.run(
        id,
        `Position ${i}`,
        `Company ${i % 97}`,
        i % 3 ? `https://example.com/jobs/${i}` : null,
        stage,
        position,
        at,
        at,
      )
      insertChange.run(id, stage, at)
      for (let n = 0; n < notesEach; n++)
        insertNote.run(randomUUID(), id, `Note ${n} of application ${i}`, at)
    }
  })()
  db.close()
}
