// Table rows (docs/contracts/database.md) and their mapping to entities
import type { Database } from 'better-sqlite3'
import type { CardColor } from '../../../domain/colors'
import type { StageId } from '../../../domain/stages'
import type { Note } from '../../../domain/types'

export interface ApplicationRow {
  id: string
  title: string
  company: string
  url: string | null
  stage: StageId
  position: number
  color: CardColor | null
  created_at: string
  updated_at: string
}

export interface NoteRow {
  id: string
  application_id: string
  text: string
  created_at: string
  updated_at: string | null
}

export interface StageChangeRow {
  application_id: string
  stage: StageId
  at: string
}

/** What every store needs: the database, the clock and the id source. */
export interface StoreContext {
  db: Database
  now: () => string
  newId: () => string
}

export function toNote(row: NoteRow): Note {
  return { id: row.id, text: row.text, createdAt: row.created_at, updatedAt: row.updated_at }
}

export function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const list = map.get(key(item))
    if (list) list.push(item)
    else map.set(key(item), [item])
  }
  return map
}
