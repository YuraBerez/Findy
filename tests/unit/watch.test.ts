import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { migrate } from '../../src/main/db/migrate'
import { watchExternalChanges } from '../../src/main/watch'

describe('watchExternalChanges (spec 004 FR-006)', () => {
  afterEach(() => vi.useRealTimers())

  it('fires only when another connection commits', () => {
    vi.useFakeTimers()
    const dir = mkdtempSync(join(tmpdir(), 'findy-watch-'))
    const app = new Database(join(dir, 'findy.db'))
    app.pragma('journal_mode = WAL')
    migrate(app, () => {})
    const other = new Database(join(dir, 'findy.db')) // e.g. the MCP server
    const onChange = vi.fn()
    const stop = watchExternalChanges(
      () => app.pragma('data_version', { simple: true }) as number,
      onChange,
      100,
    )

    app.prepare("INSERT INTO settings VALUES ('theme', 'dark')").run() // own write
    vi.advanceTimersByTime(150)
    expect(onChange).not.toHaveBeenCalled()

    other.prepare("INSERT INTO settings VALUES ('language', 'uk')").run() // external write
    vi.advanceTimersByTime(150)
    expect(onChange).toHaveBeenCalledOnce()

    vi.advanceTimersByTime(300) // nothing new
    expect(onChange).toHaveBeenCalledOnce()

    stop()
    other.close()
    app.close()
    rmSync(dir, { recursive: true, force: true })
  })
})
