import { beforeEach, describe, expect, it } from 'vitest'
import { NotFoundError, type Repository } from '../../src/main/db/repository'
import { memoryRepository } from './helpers/db'

let repo: Repository
let db: ReturnType<typeof memoryRepository>['db']

beforeEach(() => {
  ;({ repository: repo, db } = memoryRepository())
})

const input = (title: string, extra: object = {}) => ({
  title,
  company: `${title} Inc`,
  url: null,
  ...extra,
})

const column = (stage: string) =>
  repo
    .listApplications()
    .filter((app) => app.stage === stage)
    .map((app) => app.title)

describe('createApplication (US-1)', () => {
  it('creates in Applied with history and timestamps (FR-010, FR-014, FR-024)', () => {
    const app = repo.createApplication(input('Dev', { url: 'https://acme.com/1' }))
    expect(app).toMatchObject({
      title: 'Dev',
      company: 'Dev Inc',
      url: 'https://acme.com/1',
      stage: 'applied',
      order: 0,
      notes: [],
    })
    expect(app.stageHistory).toEqual([{ stage: 'applied', at: app.createdAt }])
    expect(app.updatedAt).toBe(app.createdAt)
  })

  it('puts new cards on top of the column (FR-023)', () => {
    repo.createApplication(input('A'))
    repo.createApplication(input('B'))
    expect(column('applied')).toEqual(['B', 'A'])
  })

  it('creates in the chosen stage', () => {
    repo.createApplication(input('A', { stage: 'test_task' }))
    expect(column('test_task')).toEqual(['A'])
  })
})

describe('updateApplication (FR-012)', () => {
  it('changes only the given fields and bumps updatedAt', () => {
    const created = repo.createApplication(input('A', { url: 'https://a.com' }))
    const updated = repo.updateApplication(created.id, { title: 'A2' })
    expect(updated).toMatchObject({ title: 'A2', company: 'A Inc', url: 'https://a.com' })
    expect(updated.updatedAt > created.updatedAt).toBe(true)
  })

  it('can clear the url', () => {
    const created = repo.createApplication(input('A', { url: 'https://a.com' }))
    expect(repo.updateApplication(created.id, { url: null }).url).toBeNull()
  })

  it('throws NotFoundError for an unknown id', () => {
    expect(() => repo.updateApplication('missing', { title: 'x' })).toThrow(NotFoundError)
  })
})

describe('moveApplication (FR-020…024)', () => {
  it('moves between stages, to the requested index, and records history', () => {
    const a = repo.createApplication(input('A'))
    repo.createApplication(input('B', { stage: 'hr_interview' }))
    repo.createApplication(input('C', { stage: 'hr_interview' }))

    const moved = repo.moveApplication(a.id, { stage: 'hr_interview', index: 1 })

    expect(column('hr_interview')).toEqual(['C', 'A', 'B'])
    expect(column('applied')).toEqual([])
    expect(moved.stageHistory.map((change) => change.stage)).toEqual(['applied', 'hr_interview'])
  })

  it('reorders within a column without adding history (FR-022)', () => {
    const a = repo.createApplication(input('A'))
    repo.createApplication(input('B'))
    repo.createApplication(input('C'))
    expect(column('applied')).toEqual(['C', 'B', 'A'])

    const moved = repo.moveApplication(a.id, { stage: 'applied', index: 0 })

    expect(column('applied')).toEqual(['A', 'C', 'B'])
    expect(moved.stageHistory).toHaveLength(1)
    expect(repo.listApplications().map((app) => app.order)).toEqual([0, 1, 2])
  })

  it('clamps an index past the end and renumbers the source column', () => {
    const a = repo.createApplication(input('A'))
    repo.createApplication(input('B'))
    repo.createApplication(input('C'))
    repo.moveApplication(a.id, { stage: 'rejected', index: 99 })
    const applied = repo.listApplications().filter((app) => app.stage === 'applied')
    expect(applied.map((app) => [app.title, app.order])).toEqual([
      ['C', 0],
      ['B', 1],
    ])
  })

  it('throws NotFoundError for an unknown id', () => {
    expect(() => repo.moveApplication('missing', { stage: 'offered', index: 0 })).toThrow(
      NotFoundError,
    )
  })
})

describe('deleteApplication (FR-013)', () => {
  it('removes the application with its notes and history', () => {
    const a = repo.createApplication(input('A'))
    repo.createApplication(input('B'))
    repo.addNote(a.id, 'hello')
    repo.deleteApplication(a.id)
    expect(column('applied')).toEqual(['B'])
    expect(db.prepare('SELECT COUNT(*) AS n FROM notes').get()).toEqual({ n: 0 })
    expect(db.prepare('SELECT COUNT(*) AS n FROM stage_changes').get()).toEqual({ n: 1 })
    expect(repo.listApplications()[0]?.order).toBe(0)
  })

  it('throws NotFoundError for an unknown id', () => {
    expect(() => repo.deleteApplication('missing')).toThrow(NotFoundError)
  })
})

describe('notes (FR-030…033)', () => {
  it('adds notes newest first and bumps the application', () => {
    const a = repo.createApplication(input('A'))
    repo.addNote(a.id, 'first')
    const second = repo.addNote(a.id, 'second\nline')
    const [app] = repo.listApplications()
    expect(app?.notes.map((note) => note.text)).toEqual(['second\nline', 'first'])
    expect(second.updatedAt).toBeNull()
    expect(app?.updatedAt).toBe(second.createdAt)
  })

  it('edits a note and marks it as edited', () => {
    const a = repo.createApplication(input('A'))
    const note = repo.addNote(a.id, 'draft')
    const edited = repo.updateNote(a.id, note.id, 'final')
    expect(edited.text).toBe('final')
    expect(edited.updatedAt).not.toBeNull()
    expect(edited.createdAt).toBe(note.createdAt)
  })

  it('deletes a note', () => {
    const a = repo.createApplication(input('A'))
    const note = repo.addNote(a.id, 'x')
    repo.deleteNote(a.id, note.id)
    expect(repo.listApplications()[0]?.notes).toEqual([])
  })

  it('rejects a note of another application or an unknown application', () => {
    const a = repo.createApplication(input('A'))
    const b = repo.createApplication(input('B'))
    const note = repo.addNote(a.id, 'x')
    expect(() => repo.updateNote(b.id, note.id, 'y')).toThrow(NotFoundError)
    expect(() => repo.deleteNote(b.id, note.id)).toThrow(NotFoundError)
    expect(() => repo.addNote('missing', 'x')).toThrow(NotFoundError)
  })
})

describe('settings', () => {
  it('defaults to no language and the system theme', () => {
    expect(repo.getSettings()).toEqual({ language: null, theme: 'system', hiddenStages: [] })
  })

  it('stores language and theme (FR-042, FR-083)', () => {
    repo.setLanguage('uk')
    repo.setTheme('dark')
    expect(repo.getSettings()).toEqual({ language: 'uk', theme: 'dark', hiddenStages: [] })
    expect(repo.setTheme('light').theme).toBe('light')
  })

  it('ignores unknown stored values', () => {
    db.prepare("INSERT INTO settings VALUES ('language', 'de'), ('theme', 'neon')").run()
    expect(repo.getSettings()).toEqual({ language: null, theme: 'system', hiddenStages: [] })
  })
})

describe('transactions (FR-052)', () => {
  it('rolls back the whole create when a constraint fails', () => {
    repo.createApplication(input('A'))
    expect(() => repo.createApplication(input('x'.repeat(201)))).toThrow()
    expect(column('applied')).toEqual(['A'])
    expect(repo.listApplications()[0]?.order).toBe(0)
  })
})

describe('resetBoard (FR-093)', () => {
  it('deletes every application with notes and history, and keeps the settings', () => {
    const a = repo.createApplication(input('A'))
    repo.createApplication(input('B', { stage: 'offered' }))
    repo.addNote(a.id, 'x')
    repo.setLanguage('uk')
    repo.setTheme('dark')

    repo.resetBoard()

    expect(repo.listApplications()).toEqual([])
    expect(db.prepare('SELECT COUNT(*) AS n FROM notes').get()).toEqual({ n: 0 })
    expect(db.prepare('SELECT COUNT(*) AS n FROM stage_changes').get()).toEqual({ n: 0 })
    expect(repo.getSettings()).toEqual({ language: 'uk', theme: 'dark', hiddenStages: [] })
  })
})

describe('hidden stages (spec 002)', () => {
  it('stores the hidden stages and keeps applications (FR-003, FR-004)', () => {
    repo.createApplication(input('A', { stage: 'rejected' }))
    expect(repo.setHiddenStages(['rejected', 'c_level_interview']).hiddenStages).toEqual([
      'rejected',
      'c_level_interview',
    ])
    expect(repo.listApplications().map((app) => app.stage)).toEqual(['rejected'])
    expect(repo.setHiddenStages([]).hiddenStages).toEqual([])
  })

  it('reads a damaged value as "nothing hidden"', () => {
    db.prepare("INSERT INTO settings VALUES ('hiddenStages', 'not json')").run()
    expect(repo.getSettings().hiddenStages).toEqual([])
    db.prepare("UPDATE settings SET value = '[\"nope\"]' WHERE key = 'hiddenStages'").run()
    expect(repo.getSettings().hiddenStages).toEqual([])
  })
})
