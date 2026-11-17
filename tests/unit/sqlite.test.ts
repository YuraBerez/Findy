import Database from 'better-sqlite3'
import { describe, expect, it } from 'vitest'

// architecture D-2: the native SQLite binding loads without a rebuild
describe('better-sqlite3', () => {
  it('opens an in-memory database', () => {
    const db = new Database(':memory:')
    const row = db.prepare('SELECT 1 + 1 AS result').get() as { result: number }
    expect(row.result).toBe(2)
    db.close()
  })
})
