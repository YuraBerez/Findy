import { randomUUID } from 'node:crypto'
import Database from 'better-sqlite3'
import type { StageId } from '../../src/domain/stages'
import { migrate } from '../../src/main/db/migrate'

/** An application with dates in the past; days are counted back from today, at noon local time */
export interface HistoryApplication {
  title: string
  createdDaysAgo: number
  /** Stage changes after "Applied", oldest first */
  moves?: [stage: StageId, daysAgo: number][]
}

export function daysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(12, 0, 0, 0)
  return date.toISOString()
}

/**
 * Writes applications with a past stage history before the app starts (spec 005): the
 * IPC API always uses "now", so it cannot create history on earlier days.
 */
export function writeHistoryDatabase(file: string, items: HistoryApplication[]): void {
  const db = new Database(file)
  db.pragma('journal_mode = WAL')
  migrate(db, () => {})
  const insertApp = db.prepare(
    'INSERT INTO applications (id, title, company, url, stage, position, created_at, updated_at) VALUES (?, ?, ?, NULL, ?, ?, ?, ?)',
  )
  const insertChange = db.prepare(
    'INSERT INTO stage_changes (application_id, stage, at) VALUES (?, ?, ?)',
  )
  const positions = new Map<StageId, number>()
  db.transaction(() => {
    for (const item of items) {
      const history: [StageId, string][] = [
        ['applied', daysAgo(item.createdDaysAgo)],
        ...(item.moves ?? []).map(([stage, days]): [StageId, string] => [stage, daysAgo(days)]),
      ]
      const [stage, updated] = history.at(-1)!
      const position = positions.get(stage) ?? 0
      positions.set(stage, position + 1)
      const id = randomUUID()
      insertApp.run(id, item.title, 'Acme', stage, position, history[0]![1], updated)
      for (const [change, at] of history) insertChange.run(id, change, at)
    }
  })()
  db.close()
}
