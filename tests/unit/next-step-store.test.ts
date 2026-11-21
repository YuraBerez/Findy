// Spec 015: the next step in the repository (FR-001…FR-004, FR-012, FR-030)
import { beforeEach, describe, expect, it } from 'vitest'
import { EMPTY_FIELDS } from '../../src/domain/fields'
import { NotFoundError, type Repository } from '../../src/main/db/repository'
import { memoryRepository } from './helpers/db'

let repo: Repository
let db: ReturnType<typeof memoryRepository>['db']

beforeEach(() => {
  ;({ repository: repo, db } = memoryRepository())
})

const step = { text: 'Technical interview with Oleh', date: '2026-11-26', time: '15:00' }
const create = (extra: object = {}) =>
  repo.createApplication({ title: 'Dev', company: 'Acme', url: null, ...extra })

describe('next step in the repository', () => {
  it('has no step by default, and creates one (FR-001)', () => {
    expect(create().nextStep).toBeNull()
    expect(create({ nextStep: step }).nextStep).toEqual(step)
  })

  it('changes only the step and updatedAt (FR-003)', () => {
    const app = create()
    create()
    const before = repo.getApplication(app.id)
    const updated = repo.updateApplication(app.id, { nextStep: step })
    expect(updated.nextStep).toEqual(step)
    expect(updated.updatedAt > before.updatedAt).toBe(true)
    expect(updated.stageHistory).toEqual(before.stageHistory)
    expect(updated.order).toBe(before.order)
  })

  it('keeps the step when a patch leaves it out, clears it with null', () => {
    const app = create({ nextStep: step })
    expect(repo.updateApplication(app.id, { title: 'Lead' }).nextStep).toEqual(step)
    expect(repo.updateApplication(app.id, { nextStep: null }).nextStep).toBeNull()
  })

  it('keeps the step after a move (FR-004)', () => {
    const app = create({ nextStep: step })
    expect(repo.moveApplication(app.id, { stage: 'rejected', index: 0 }).nextStep).toEqual(step)
  })

  it('"Done" removes the step and adds one note (FR-012)', () => {
    const app = create({ nextStep: step })
    const done = repo.completeNextStep(app.id, (s) => `Done: ${s.text}`)
    expect(done.nextStep).toBeNull()
    expect(done.notes.map((note) => note.text)).toEqual(['Done: Technical interview with Oleh'])
    expect(done.updatedAt > app.updatedAt).toBe(true)
  })

  it('"Done" without a step is NOT_FOUND and changes nothing', () => {
    const app = create()
    expect(() => repo.completeNextStep(app.id, () => 'x')).toThrow(NotFoundError)
    expect(repo.getApplication(app.id).notes).toEqual([])
  })

  it('lists only the rows with a valid step (NFR-005)', () => {
    const a = create({ nextStep: step })
    create()
    const broken = create()
    db.prepare("UPDATE applications SET next_step_text = 'x' WHERE id = ?").run(broken.id)
    expect(repo.listNextSteps()).toEqual([
      { id: a.id, title: 'Dev', company: 'Acme', stage: 'applied', nextStep: step },
    ])
    expect(repo.getApplication(broken.id).nextStep).toBeNull()
  })

  it('reads a row with an invalid date as no step', () => {
    const app = create()
    db.prepare(
      "UPDATE applications SET next_step_text = 'x', next_step_date = '2026-02-30' WHERE id = ?",
    ).run(app.id)
    expect(repo.getApplication(app.id).nextStep).toBeNull()
  })

  it('imports a step', () => {
    repo.importApplications([
      {
        title: 'A',
        company: 'Acme',
        url: null,
        stage: 'applied',
        color: null,
        fields: EMPTY_FIELDS,
        nextStep: { ...step, time: null },
        createdAt: '2026-10-01T08:00:00.000Z',
        stageHistory: [{ stage: 'applied', at: '2026-10-01T08:00:00.000Z' }],
        notes: [],
      },
    ])
    expect(repo.listApplications().find((app) => app.title === 'A')!.nextStep).toEqual({
      ...step,
      time: null,
    })
  })
})

describe('remindersEnabled (FR-030)', () => {
  it('is on by default; only an explicit false turns it off', () => {
    expect(repo.getSettings().remindersEnabled).toBe(true)
    expect(repo.setRemindersEnabled(false).remindersEnabled).toBe(false)
    expect(repo.setRemindersEnabled(true).remindersEnabled).toBe(true)
    db.prepare("UPDATE settings SET value = 'nope' WHERE key = 'remindersEnabled'").run()
    expect(repo.getSettings().remindersEnabled).toBe(true)
  })

  it('a board reset does not change it', () => {
    repo.setRemindersEnabled(false)
    create({ nextStep: step })
    repo.resetBoard()
    expect(repo.getSettings().remindersEnabled).toBe(false)
  })
})
