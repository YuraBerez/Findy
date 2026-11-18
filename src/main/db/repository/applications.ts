import type { CardColor } from '../../../domain/colors'
import type { ApplicationInput, ApplicationPatch, MoveTarget } from '../../../domain/schema'
import { DEFAULT_STAGE, isStageId, STAGES, type StageId } from '../../../domain/stages'
import type { Application } from '../../../domain/types'
import { NotFoundError } from './errors'
import {
  groupBy,
  toNote,
  type ApplicationRow,
  type NoteRow,
  type StageChangeRow,
  type StoreContext,
} from './rows'
import type { SettingsStore } from './settings'

/** Applications with their stage history and notes; the order of cards in a stage. */
export class ApplicationStore {
  constructor(
    private readonly ctx: StoreContext,
    private readonly settings: SettingsStore,
  ) {}

  list(): Application[] {
    const { db } = this.ctx
    const rows = db
      .prepare('SELECT * FROM applications ORDER BY stage, position')
      .all() as ApplicationRow[]
    const notes = db
      .prepare('SELECT * FROM notes ORDER BY created_at DESC, rowid DESC')
      .all() as NoteRow[]
    const history = db
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
        color: row.color,
        stageHistory: (historyByApp.get(row.id) ?? []).map(({ stage, at }) => ({ stage, at })),
        notes: (notesByApp.get(row.id) ?? []).map(toNote),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))
  }

  get(id: string): Application {
    const application = this.list().find((app) => app.id === id)
    if (!application) throw new NotFoundError('Application', id)
    return application
  }

  create(input: ApplicationInput): Application {
    const { db } = this.ctx
    const id = this.ctx.newId()
    const at = this.ctx.now()
    const stage = input.stage ?? DEFAULT_STAGE
    this.settings.assertVisible(stage)
    db.transaction(() => {
      // FR-023: new cards go to the top of the column
      db.prepare('UPDATE applications SET position = position + 1 WHERE stage = ?').run(stage)
      db.prepare(
        `INSERT INTO applications (id, title, company, url, stage, position, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
      ).run(id, input.title, input.company, input.url, stage, at, at)
      this.addStageChange(id, stage, at)
    })()
    return this.get(id)
  }

  update(id: string, patch: ApplicationPatch): Application {
    const { db } = this.ctx
    db.transaction(() => {
      const current = this.require(id)
      db.prepare(
        'UPDATE applications SET title = ?, company = ?, url = ?, updated_at = ? WHERE id = ?',
      ).run(
        patch.title ?? current.title,
        patch.company ?? current.company,
        patch.url === undefined ? current.url : patch.url,
        this.ctx.now(),
        id,
      )
    })()
    return this.get(id)
  }

  /** Spec 007 FR-006, FR-008: only the colour and `updatedAt`; no history, same position. */
  setColor(id: string, color: CardColor | null): Application {
    const { db } = this.ctx
    db.transaction(() => {
      this.require(id)
      db.prepare('UPDATE applications SET color = ?, updated_at = ? WHERE id = ?').run(
        color,
        this.ctx.now(),
        id,
      )
    })()
    return this.get(id)
  }

  /** FR-020…024: move to any stage and position; history only on a stage change. */
  move(id: string, target: MoveTarget): Application {
    const { db } = this.ctx
    this.settings.assertVisible(target.stage)
    db.transaction(() => {
      const current = this.require(id)
      const at = this.ctx.now()

      const others = this.idsInStage(target.stage).filter((other) => other !== id)
      const index = Math.min(target.index, others.length)
      others.splice(index, 0, id)

      db.prepare('UPDATE applications SET stage = ?, updated_at = ? WHERE id = ?').run(
        target.stage,
        at,
        id,
      )
      this.renumber(others)

      if (current.stage !== target.stage) {
        this.renumber(this.idsInStage(current.stage))
        this.addStageChange(id, target.stage, at)
      }
    })()
    return this.get(id)
  }

  delete(id: string): void {
    const { db } = this.ctx
    db.transaction(() => {
      const current = this.require(id)
      db.prepare('DELETE FROM applications WHERE id = ?').run(id)
      this.renumber(this.idsInStage(current.stage))
    })()
  }

  /** FR-093: delete every application; notes and history go by ON DELETE CASCADE. */
  deleteAll(): void {
    this.ctx.db.transaction(() => {
      this.ctx.db.prepare('DELETE FROM applications').run()
    })()
  }

  /** The row of an existing application, or NotFoundError. Call inside a transaction. */
  require(id: string): ApplicationRow {
    const row = this.ctx.db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as
      ApplicationRow | undefined
    if (!row || !isStageId(row.stage)) throw new NotFoundError('Application', id)
    return row
  }

  /** Bumps `updatedAt`, e.g. after a change to a note. */
  touch(id: string, at: string): void {
    this.ctx.db.prepare('UPDATE applications SET updated_at = ? WHERE id = ?').run(at, id)
  }

  private idsInStage(stage: StageId): string[] {
    return (
      this.ctx.db
        .prepare('SELECT id FROM applications WHERE stage = ? ORDER BY position')
        .all(stage) as { id: string }[]
    ).map((row) => row.id)
  }

  private renumber(ids: string[]): void {
    const update = this.ctx.db.prepare('UPDATE applications SET position = ? WHERE id = ?')
    ids.forEach((id, position) => update.run(position, id))
  }

  private addStageChange(applicationId: string, stage: StageId, at: string): void {
    this.ctx.db
      .prepare('INSERT INTO stage_changes (application_id, stage, at) VALUES (?, ?, ?)')
      .run(applicationId, stage, at)
  }
}
