import type { CardColor } from '../../../domain/colors'
import {
  EMPTY_FIELDS,
  patchFields,
  sourceFromUrl,
  type ApplicationFields,
} from '../../../domain/fields'
import type { NextStep, StepRef } from '../../../domain/nextStep'
import type { ApplicationInput, ApplicationPatch, MoveTarget } from '../../../domain/schema'
import { DEFAULT_STAGE, isStageId, STAGES, type StageId } from '../../../domain/stages'
import type { ImportedApplication } from '../../../domain/transfer'
import type { Application } from '../../../domain/types'
import { NotFoundError } from './errors'
import {
  fieldValues,
  FIELD_COLUMNS,
  groupBy,
  stepValues,
  STEP_COLUMNS,
  toFields,
  toNextStep,
  toNote,
  type ApplicationRow,
  type NoteRow,
  type StageChangeRow,
  type StoreContext,
} from './rows'
import type { SettingsStore } from './settings'
import type { SitesStore } from './sites'

/** Spec 014 fields and the spec 015 step: the optional columns of every write */
const OPTIONAL_COLUMNS = [...FIELD_COLUMNS, ...STEP_COLUMNS]
const FIELD_LIST = OPTIONAL_COLUMNS.join(', ')
const FIELD_PARAMS = OPTIONAL_COLUMNS.map(() => '?').join(', ')
const FIELD_SET = OPTIONAL_COLUMNS.map((column) => `${column} = ?`).join(', ')

const optionalValues = (fields: ApplicationFields, step: NextStep | null) => [
  ...fieldValues(fields),
  ...stepValues(step),
]

/** Applications with their stage history and notes; the order of cards in a stage. */
export class ApplicationStore {
  constructor(
    private readonly ctx: StoreContext,
    private readonly settings: SettingsStore,
    private readonly sites: SitesStore,
  ) {}

  /** Spec 014 FR-020, FR-021: an empty source comes from the link; a set one stays */
  private withSource(fields: ApplicationFields, url: string | null): ApplicationFields {
    if (fields.source) return fields
    return { ...fields, source: sourceFromUrl(url, this.sites.list()) }
  }

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
        ...toFields(row),
        nextStep: toNextStep(row),
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
      const fields = this.withSource(patchFields(EMPTY_FIELDS, input), input.url)
      // FR-023: new cards go to the top of the column
      db.prepare('UPDATE applications SET position = position + 1 WHERE stage = ?').run(stage)
      db.prepare(
        `INSERT INTO applications (id, title, company, url, stage, position, created_at, updated_at, ${FIELD_LIST})
         VALUES (?, ?, ?, ?, ?, 0, ?, ?, ${FIELD_PARAMS})`,
      ).run(
        id,
        input.title,
        input.company,
        input.url,
        stage,
        at,
        at,
        ...optionalValues(fields, input.nextStep ?? null),
      )
      this.addStageChange(id, stage, at)
    })()
    return this.get(id)
  }

  update(id: string, patch: ApplicationPatch): Application {
    const { db } = this.ctx
    db.transaction(() => {
      const current = this.require(id)
      const url = patch.url === undefined ? current.url : patch.url
      let fields = patchFields(toFields(current), patch)
      // Spec 014 FR-020: a new link fills an empty source
      if (url !== current.url) fields = this.withSource(fields, url)
      // Spec 015 FR-003: a whole value; `null` clears it, a missing key keeps it
      const step = patch.nextStep === undefined ? toNextStep(current) : patch.nextStep
      db.prepare(
        `UPDATE applications SET title = ?, company = ?, url = ?, updated_at = ?, ${FIELD_SET}
         WHERE id = ?`,
      ).run(
        patch.title ?? current.title,
        patch.company ?? current.company,
        url,
        this.ctx.now(),
        ...optionalValues(fields, step),
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

  /**
   * Spec 015 FR-012: removes the step and adds the note `noteText(step)` in one
   * transaction. NotFoundError when the application has no step.
   */
  completeNextStep(id: string, noteText: (step: NextStep) => string): Application {
    const { db } = this.ctx
    db.transaction(() => {
      const step = toNextStep(this.require(id))
      if (!step) throw new NotFoundError('Next step of application', id)
      const at = this.ctx.now()
      db.prepare(
        'INSERT INTO notes (id, application_id, text, created_at, updated_at) VALUES (?, ?, ?, ?, NULL)',
      ).run(this.ctx.newId(), id, noteText(step), at)
      db.prepare(
        `UPDATE applications SET ${STEP_COLUMNS.map((column) => `${column} = NULL`).join(', ')},
         updated_at = ? WHERE id = ?`,
      ).run(at, id)
    })()
    return this.get(id)
  }

  /** Spec 015 NFR-005: only the rows with a step, without notes or history (reminders) */
  listNextSteps(): StepRef[] {
    const rows = this.ctx.db
      .prepare('SELECT * FROM applications WHERE next_step_date IS NOT NULL')
      .all() as ApplicationRow[]
    return rows.flatMap((row) => {
      const nextStep = toNextStep(row)
      return nextStep && isStageId(row.stage)
        ? [{ id: row.id, title: row.title, company: row.company, stage: row.stage, nextStep }]
        : []
    })
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

  /**
   * Spec 008 FR-017, FR-018: all or none, on top of their columns in the given order.
   * Hidden stages are allowed (spec 008 D-6). Returns the number added.
   */
  importMany(items: ImportedApplication[]): number {
    const { db } = this.ctx
    const at = this.ctx.now()
    db.transaction(() => {
      const shift = db.prepare('UPDATE applications SET position = position + ? WHERE stage = ?')
      const insert = db.prepare(
        `INSERT INTO applications (id, title, company, url, stage, position, color, created_at, updated_at, ${FIELD_LIST})
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ${FIELD_PARAMS})`,
      )
      const addNote = db.prepare(
        'INSERT INTO notes (id, application_id, text, created_at, updated_at) VALUES (?, ?, ?, ?, NULL)',
      )
      for (const stage of STAGES) {
        const count = items.filter((item) => item.stage === stage).length
        if (count > 0) shift.run(count, stage)
      }
      const next = new Map<StageId, number>()
      for (const item of items) {
        const position = next.get(item.stage) ?? 0
        next.set(item.stage, position + 1)
        const id = this.ctx.newId()
        insert.run(
          id,
          item.title,
          item.company,
          item.url,
          item.stage,
          position,
          item.color,
          item.createdAt,
          at,
          // Spec 014 FR-022: the file gave no source → from the link
          ...optionalValues(this.withSource(item.fields, item.url), item.nextStep),
        )
        for (const change of item.stageHistory) this.addStageChange(id, change.stage, change.at)
        for (const note of item.notes) addNote.run(this.ctx.newId(), id, note.text, note.createdAt)
      }
    })()
    return items.length
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
