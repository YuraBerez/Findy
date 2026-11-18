import { randomUUID } from 'node:crypto'
import type { Database } from 'better-sqlite3'
import type { ApplicationInput, ApplicationPatch, MoveTarget } from '../../domain/schema'
import { DEFAULT_STAGE, isStageId, STAGES, type StageId } from '../../domain/stages'
import { DEFAULT_ANALYTICS_VIEW, type AnalyticsView } from '../../domain/analytics'
import { AnalyticsViewSchema, HiddenStagesSchema } from '../../domain/schema'
import type { Application, Language, Note, Settings, Theme } from '../../domain/types'

/** Spec 002 FR-006: no application may go into a hidden column (IPC and MCP alike) */
export class HiddenStageError extends Error {
  constructor(readonly stage: StageId) {
    super(`The stage "${stage}" is hidden on the board`)
    this.name = 'HiddenStageError'
  }
}

export class NotFoundError extends Error {
  constructor(what: string, id: string) {
    super(`${what} not found: ${id}`)
    this.name = 'NotFoundError'
  }
}

interface ApplicationRow {
  id: string
  title: string
  company: string
  url: string | null
  stage: StageId
  position: number
  created_at: string
  updated_at: string
}

interface NoteRow {
  id: string
  application_id: string
  text: string
  created_at: string
  updated_at: string | null
}

interface StageChangeRow {
  application_id: string
  stage: StageId
  at: string
}

export interface RepositoryOptions {
  now?: () => string
  newId?: () => string
}

/**
 * All reads and writes of user data. Every mutation runs in one transaction (FR-052).
 * Inputs are expected to be validated already (domain/schema.ts); the schema's CHECK
 * constraints are the last line of defence.
 */
export class Repository {
  private readonly now: () => string
  private readonly newId: () => string

  constructor(
    private readonly db: Database,
    options: RepositoryOptions = {},
  ) {
    this.now = options.now ?? (() => new Date().toISOString())
    this.newId = options.newId ?? randomUUID
  }

  // ── Reads ────────────────────────────────────────────────────────────────

  listApplications(): Application[] {
    const rows = this.db
      .prepare('SELECT * FROM applications ORDER BY stage, position')
      .all() as ApplicationRow[]
    const notes = this.db
      .prepare('SELECT * FROM notes ORDER BY created_at DESC, rowid DESC')
      .all() as NoteRow[]
    const history = this.db
      .prepare('SELECT application_id, stage, at FROM stage_changes ORDER BY at, id')
      .all() as StageChangeRow[]

    const notesByApp = groupBy(notes, (note) => note.application_id)
    const historyByApp = groupBy(history, (change) => change.application_id)
    const stageIndex = (stage: StageId) => STAGES.indexOf(stage)

    return rows
      .sort((a, b) => stageIndex(a.stage) - stageIndex(b.stage) || a.position - b.position)
      .map((row) => ({
        id: row.id,
        title: row.title,
        company: row.company,
        url: row.url,
        stage: row.stage,
        order: row.position,
        stageHistory: (historyByApp.get(row.id) ?? []).map(({ stage, at }) => ({ stage, at })),
        notes: (notesByApp.get(row.id) ?? []).map(toNote),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))
  }

  getSettings(): Settings {
    const rows = this.db.prepare('SELECT key, value FROM settings').all() as {
      key: string
      value: string
    }[]
    const map = new Map(rows.map((row) => [row.key, row.value]))
    const language = map.get('language')
    const theme = map.get('theme')
    return {
      language: language === 'en' || language === 'uk' ? language : null,
      theme: theme === 'light' || theme === 'dark' ? theme : 'system',
      hiddenStages: parseHiddenStages(map.get('hiddenStages')),
      mcpEnabled: map.get('mcpEnabled') === 'true',
      analytics: parseAnalyticsView(map.get('analytics')),
    }
  }

  // ── Applications ─────────────────────────────────────────────────────────

  createApplication(input: ApplicationInput): Application {
    const id = this.newId()
    const at = this.now()
    const stage = input.stage ?? DEFAULT_STAGE
    this.assertVisible(stage)
    this.db.transaction(() => {
      // FR-023: new cards go to the top of the column
      this.db.prepare('UPDATE applications SET position = position + 1 WHERE stage = ?').run(stage)
      this.db
        .prepare(
          `INSERT INTO applications (id, title, company, url, stage, position, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
        )
        .run(id, input.title, input.company, input.url, stage, at, at)
      this.addStageChange(id, stage, at)
    })()
    return this.getApplication(id)
  }

  updateApplication(id: string, patch: ApplicationPatch): Application {
    this.db.transaction(() => {
      const current = this.requireApplication(id)
      this.db
        .prepare(
          'UPDATE applications SET title = ?, company = ?, url = ?, updated_at = ? WHERE id = ?',
        )
        .run(
          patch.title ?? current.title,
          patch.company ?? current.company,
          patch.url === undefined ? current.url : patch.url,
          this.now(),
          id,
        )
    })()
    return this.getApplication(id)
  }

  /** FR-020…024: move to any stage and position; history only on a stage change. */
  moveApplication(id: string, target: MoveTarget): Application {
    this.assertVisible(target.stage)
    this.db.transaction(() => {
      const current = this.requireApplication(id)
      const at = this.now()

      const others = this.idsInStage(target.stage).filter((other) => other !== id)
      const index = Math.min(target.index, others.length)
      others.splice(index, 0, id)

      this.db
        .prepare('UPDATE applications SET stage = ?, updated_at = ? WHERE id = ?')
        .run(target.stage, at, id)
      this.renumber(others)

      if (current.stage !== target.stage) {
        this.renumber(this.idsInStage(current.stage))
        this.addStageChange(id, target.stage, at)
      }
    })()
    return this.getApplication(id)
  }

  deleteApplication(id: string): void {
    this.db.transaction(() => {
      const current = this.requireApplication(id)
      this.db.prepare('DELETE FROM applications WHERE id = ?').run(id)
      this.renumber(this.idsInStage(current.stage))
    })()
  }

  /** FR-093: delete every application; notes and history go by ON DELETE CASCADE. */
  resetBoard(): void {
    this.db.transaction(() => {
      this.db.prepare('DELETE FROM applications').run()
    })()
  }

  // ── Notes ────────────────────────────────────────────────────────────────

  addNote(applicationId: string, text: string): Note {
    const id = this.newId()
    const at = this.now()
    this.db.transaction(() => {
      this.requireApplication(applicationId)
      this.db
        .prepare(
          'INSERT INTO notes (id, application_id, text, created_at, updated_at) VALUES (?, ?, ?, ?, NULL)',
        )
        .run(id, applicationId, text, at)
      this.touch(applicationId, at)
    })()
    return this.getNote(id)
  }

  updateNote(applicationId: string, noteId: string, text: string): Note {
    const at = this.now()
    this.db.transaction(() => {
      this.requireNote(applicationId, noteId)
      this.db
        .prepare('UPDATE notes SET text = ?, updated_at = ? WHERE id = ?')
        .run(text, at, noteId)
      this.touch(applicationId, at)
    })()
    return this.getNote(noteId)
  }

  deleteNote(applicationId: string, noteId: string): void {
    this.db.transaction(() => {
      this.requireNote(applicationId, noteId)
      this.db.prepare('DELETE FROM notes WHERE id = ?').run(noteId)
      this.touch(applicationId, this.now())
    })()
  }

  // ── Settings ─────────────────────────────────────────────────────────────

  setLanguage(language: Language): Settings {
    this.setSetting('language', language)
    return this.getSettings()
  }

  setTheme(theme: Theme): Settings {
    this.setSetting('theme', theme)
    return this.getSettings()
  }

  setMcpEnabled(enabled: boolean): Settings {
    this.setSetting('mcpEnabled', String(enabled))
    return this.getSettings()
  }

  getApplication(id: string): Application {
    const application = this.listApplications().find((app) => app.id === id)
    if (!application) throw new NotFoundError('Application', id)
    return application
  }

  setHiddenStages(stages: StageId[]): Settings {
    this.setSetting('hiddenStages', JSON.stringify(stages))
    return this.getSettings()
  }

  setAnalyticsView(view: AnalyticsView): Settings {
    this.setSetting('analytics', JSON.stringify(view))
    return this.getSettings()
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private assertVisible(stage: StageId): void {
    if (this.getSettings().hiddenStages.includes(stage)) throw new HiddenStageError(stage)
  }

  private getNote(id: string): Note {
    return toNote(this.db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as NoteRow)
  }

  private requireApplication(id: string): ApplicationRow {
    const row = this.db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as
      ApplicationRow | undefined
    if (!row || !isStageId(row.stage)) throw new NotFoundError('Application', id)
    return row
  }

  private requireNote(applicationId: string, noteId: string): void {
    const row = this.db
      .prepare('SELECT id FROM notes WHERE id = ? AND application_id = ?')
      .get(noteId, applicationId)
    if (!row) throw new NotFoundError('Note', noteId)
  }

  private idsInStage(stage: StageId): string[] {
    return (
      this.db
        .prepare('SELECT id FROM applications WHERE stage = ? ORDER BY position')
        .all(stage) as { id: string }[]
    ).map((row) => row.id)
  }

  private renumber(ids: string[]): void {
    const update = this.db.prepare('UPDATE applications SET position = ? WHERE id = ?')
    ids.forEach((id, position) => update.run(position, id))
  }

  private addStageChange(applicationId: string, stage: StageId, at: string): void {
    this.db
      .prepare('INSERT INTO stage_changes (application_id, stage, at) VALUES (?, ?, ?)')
      .run(applicationId, stage, at)
  }

  private touch(applicationId: string, at: string): void {
    this.db.prepare('UPDATE applications SET updated_at = ? WHERE id = ?').run(at, applicationId)
  }

  private setSetting(key: string, value: string): void {
    this.db
      .prepare(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      )
      .run(key, value)
  }
}

/** A damaged or invalid value means "nothing hidden", never a broken board. */
function parseHiddenStages(raw: string | undefined): StageId[] {
  if (!raw) return []
  try {
    const parsed = HiddenStagesSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : []
  } catch {
    return []
  }
}

/** A damaged or invalid value means the default view (spec 005 US-6.1). */
function parseAnalyticsView(raw: string | undefined): AnalyticsView {
  if (!raw) return DEFAULT_ANALYTICS_VIEW
  try {
    const parsed = AnalyticsViewSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : DEFAULT_ANALYTICS_VIEW
  } catch {
    return DEFAULT_ANALYTICS_VIEW
  }
}

function toNote(row: NoteRow): Note {
  return { id: row.id, text: row.text, createdAt: row.created_at, updatedAt: row.updated_at }
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const list = map.get(key(item))
    if (list) list.push(item)
    else map.set(key(item), [item])
  }
  return map
}
