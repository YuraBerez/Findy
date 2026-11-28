import { beforeEach, describe, expect, it } from 'vitest'
import { EMPTY_FIELDS } from '../../src/domain/fields'
import type { StageId } from '../../src/domain/stages'
import type { Application } from '../../src/domain/types'
import {
  HiddenStageError,
  NotFoundError,
  OnlyStageChangeError,
  SiteLimitError,
  type Repository,
} from '../../src/main/db/repository'
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

describe('setApplicationColor (spec 007)', () => {
  it('new applications have no colour (US-3)', () => {
    expect(repo.createApplication(input('Dev')).color).toBeNull()
  })

  it('sets and clears the colour and bumps updatedAt (FR-006)', () => {
    const app = repo.createApplication(input('Dev'))
    const red = repo.setApplicationColor(app.id, 'red')
    expect(red.color).toBe('red')
    expect(red.updatedAt > app.updatedAt).toBe(true)
    expect(repo.getApplication(app.id).color).toBe('red')
    expect(repo.setApplicationColor(app.id, null).color).toBeNull()
  })

  it('spec 025: create and update set, clear or keep the colour', () => {
    const app = repo.createApplication({ ...input('Dev'), color: 'green' })
    expect(app.color).toBe('green')
    expect(repo.updateApplication(app.id, { title: 'Lead' })).toMatchObject({
      title: 'Lead',
      color: 'green',
    })
    expect(repo.updateApplication(app.id, { color: 'red', company: 'Globex' })).toMatchObject({
      company: 'Globex',
      color: 'red',
    })
    expect(repo.updateApplication(app.id, { color: null }).color).toBeNull()
  })

  it('adds no history and keeps the position (FR-008)', () => {
    repo.createApplication(input('A'))
    const b = repo.createApplication(input('B'))
    const colored = repo.setApplicationColor(b.id, 'blue')
    expect(colored.stageHistory).toEqual(b.stageHistory)
    expect(column('applied')).toEqual(['B', 'A'])
  })

  it('keeps the colour on move, edit and notes (FR-006)', () => {
    const app = repo.createApplication(input('Dev'))
    repo.setApplicationColor(app.id, 'green')
    repo.moveApplication(app.id, { stage: 'offered', index: 0 })
    repo.updateApplication(app.id, { title: 'Lead' })
    repo.addNote(app.id, 'call back')
    expect(repo.getApplication(app.id)).toMatchObject({
      title: 'Lead',
      stage: 'offered',
      color: 'green',
    })
  })

  it('throws NotFoundError for an unknown id', () => {
    expect(() => repo.setApplicationColor('nope', 'red')).toThrow(NotFoundError)
  })
})

describe('application fields (spec 014)', () => {
  const salary = { min: 3000, max: 4000, currency: 'USD' as const, period: 'month' as const }

  it('new and old applications have empty fields (FR-001)', () => {
    expect(repo.createApplication(input('Dev'))).toMatchObject(EMPTY_FIELDS)
  })

  it('saves, changes and clears the fields; bumps only updatedAt (FR-004)', () => {
    const app = repo.createApplication(input('Dev'))
    const updated = repo.updateApplication(app.id, {
      salary,
      workFormat: 'remote',
      location: 'EU time zone',
      source: { kind: 'channel', id: 'referral' },
      contactName: 'Olena',
      contactDetails: 't.me/olena_hr',
    })
    expect(updated).toMatchObject({
      salary,
      workFormat: 'remote',
      location: 'EU time zone',
      source: { kind: 'channel', id: 'referral' },
      contactName: 'Olena',
      contactDetails: 't.me/olena_hr',
      stageHistory: app.stageHistory,
      order: app.order,
    })
    expect(updated.updatedAt > app.updatedAt).toBe(true)

    const cleared = repo.updateApplication(app.id, { salary: null, location: null })
    expect(cleared).toMatchObject({ salary: null, location: null, workFormat: 'remote' })
  })

  it('keeps the name of a custom source after the site goes away (FR-005)', () => {
    const site = repo.addSite({ name: 'Acme careers', url: 'https://careers.acme.com/' })
    const app = repo.createApplication(input('Dev', { url: 'https://careers.acme.com/7' }))
    expect(app.source).toEqual({ kind: 'custom', name: 'Acme careers' })
    repo.deleteSite(site.id)
    expect(repo.getApplication(app.id).source).toEqual({ kind: 'custom', name: 'Acme careers' })
  })

  it('fills an empty source from the link, never over a set one (FR-020, FR-021)', () => {
    const app = repo.createApplication(input('Dev', { url: 'https://djinni.co/jobs/1/' }))
    expect(app.source).toEqual({ kind: 'site', id: 'djinni' })

    const moved = repo.updateApplication(app.id, { url: 'https://www.linkedin.com/jobs/view/2' })
    expect(moved.source).toEqual({ kind: 'site', id: 'djinni' })

    const chosen = repo.createApplication(
      input('Two', { url: 'https://djinni.co/jobs/3/', source: { kind: 'channel', id: 'other' } }),
    )
    expect(chosen.source).toEqual({ kind: 'channel', id: 'other' })

    const plain = repo.createApplication(input('Three'))
    expect(plain.source).toBeNull()
    expect(
      repo.updateApplication(plain.id, { url: 'https://jobs.dou.ua/vacancies/1/' }).source,
    ).toEqual({
      kind: 'site',
      id: 'dou',
    })
    // The same link again does not bring back a source the user cleared
    expect(repo.updateApplication(plain.id, { source: null, title: 'Four' }).source).toBeNull()
  })

  it('reads an unknown stored source as no source', () => {
    const app = repo.createApplication(input('Dev'))
    db.prepare("UPDATE applications SET source_kind = 'site', source_value = 'monster'").run()
    expect(repo.getApplication(app.id).source).toBeNull()
  })

  it('imports the fields and fills the source from the link (FR-022)', () => {
    repo.importApplications([
      {
        title: 'A',
        company: 'Acme',
        url: 'https://djinni.co/jobs/9/',
        stage: 'applied',
        color: null,
        fields: { ...EMPTY_FIELDS, salary, location: 'Lviv' },
        nextStep: null,
        createdAt: '2026-10-01T08:00:00.000Z',
        stageHistory: [{ stage: 'applied', at: '2026-10-01T08:00:00.000Z' }],
        notes: [],
      },
    ])
    expect(repo.listApplications()[0]).toMatchObject({
      salary,
      location: 'Lviv',
      source: { kind: 'site', id: 'djinni' },
    })
  })
})

describe('importApplications (spec 008)', () => {
  const item = (title: string, stage: 'applied' | 'offered' | 'rejected' = 'applied') => ({
    title,
    company: 'Acme',
    url: null,
    stage,
    color: 'blue' as const,
    fields: EMPTY_FIELDS,
    nextStep: null,
    createdAt: '2026-10-01T08:00:00.000Z',
    stageHistory: [
      { stage: 'applied' as const, at: '2026-10-01T08:00:00.000Z' },
      ...(stage === 'applied' ? [] : [{ stage, at: '2026-10-05T08:00:00.000Z' }]),
    ],
    notes: [
      { text: 'newer', createdAt: '2026-10-03T08:00:00.000Z' },
      { text: 'older', createdAt: '2026-10-02T08:00:00.000Z' },
    ],
  })

  it('adds on top of the columns in file order, with history, notes and colour (FR-018, FR-019)', () => {
    repo.createApplication(input('Old'))
    expect(repo.importApplications([item('A'), item('B', 'offered'), item('C')])).toBe(3)
    expect(column('applied')).toEqual(['A', 'C', 'Old'])
    expect(column('offered')).toEqual(['B'])
    const b = repo.listApplications().find((app) => app.title === 'B')!
    expect(b).toMatchObject({
      color: 'blue',
      createdAt: '2026-10-01T08:00:00.000Z',
      stageHistory: [
        { stage: 'applied', at: '2026-10-01T08:00:00.000Z' },
        { stage: 'offered', at: '2026-10-05T08:00:00.000Z' },
      ],
      notes: [
        { text: 'newer', createdAt: '2026-10-03T08:00:00.000Z', updatedAt: null },
        { text: 'older', createdAt: '2026-10-02T08:00:00.000Z', updatedAt: null },
      ],
    })
    expect(repo.listApplications().map((app) => app.order)).toEqual([0, 1, 2, 0])
  })

  it('imports into a hidden stage (D-6)', () => {
    repo.setHiddenStages(['rejected'])
    repo.importApplications([item('R', 'rejected')])
    expect(column('rejected')).toEqual(['R'])
  })

  it('adds all or nothing (FR-017)', () => {
    repo.createApplication(input('Old'))
    expect(() => repo.importApplications([item('A'), { ...item('B'), title: '' }])).toThrow()
    expect(column('applied')).toEqual(['Old'])
    expect(repo.listApplications()[0]!.order).toBe(0)
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

describe('deleteStageChange (spec 021)', () => {
  /** An application that went through `stages` after "Applied" */
  const withHistory = (title: string, ...stages: StageId[]) => {
    const { id } = repo.createApplication(input(title))
    for (const stage of stages) repo.moveApplication(id, { stage, index: 0 })
    return repo.getApplication(id)
  }
  const entry = (app: Application, index: number) => ({ index, ...app.stageHistory[index]! })
  const stagesOf = (app: Application) => app.stageHistory.map((change) => change.stage)

  it('deletes a middle entry; the card keeps its column and position (FR-006, US-1.1)', () => {
    repo.createApplication(input('Other'))
    repo.moveApplication(repo.listApplications()[0]!.id, { stage: 'hr_interview', index: 0 })
    const app = withHistory('Dev', 'technical_interview', 'hr_interview')
    repo.moveApplication(app.id, { stage: 'hr_interview', index: 1 })
    const before = repo.getApplication(app.id)

    const after = repo.deleteStageChange(app.id, entry(before, 1))

    expect(stagesOf(after)).toEqual(['applied', 'hr_interview'])
    expect(after.stageHistory[1]).toEqual(before.stageHistory[2])
    expect(column('hr_interview')).toEqual(['Other', 'Dev'])
    expect(after.updatedAt > before.updatedAt).toBe(true)
  })

  it('deletes the last entry; the card goes to the top of the previous stage (FR-005, US-2.1)', () => {
    withHistory('Top', 'hr_interview')
    const app = withHistory('Dev', 'hr_interview', 'offered')
    withHistory('Next offer', 'offered')

    const after = repo.deleteStageChange(app.id, entry(app, 2))

    expect(after.stage).toBe('hr_interview')
    expect(stagesOf(after)).toEqual(['applied', 'hr_interview'])
    expect(column('hr_interview')).toEqual(['Dev', 'Top'])
    expect(
      repo
        .listApplications()
        .filter((a) => a.stage === 'offered')
        .map((a) => a.order),
    ).toEqual([0])
  })

  it('merges equal neighbours into the earlier entry (FR-004, US-3)', () => {
    const app = withHistory('Dev', 'hr_interview', 'applied')
    const after = repo.deleteStageChange(app.id, entry(app, 1))
    expect(after.stageHistory).toEqual([app.stageHistory[0]])
    expect(after.stage).toBe('applied')
  })

  it('may move the card into a hidden stage (D-3)', () => {
    const app = withHistory('Dev', 'test_task', 'offered')
    repo.setHiddenStages(['test_task'])
    expect(repo.deleteStageChange(app.id, entry(app, 2)).stage).toBe('test_task')
  })

  it('changes nothing but the history and updatedAt; adds no entry (FR-007, FR-008)', () => {
    const app = withHistory('Dev', 'hr_interview', 'test_task')
    repo.addNote(app.id, 'kept')
    repo.setApplicationColor(app.id, 'blue')
    const before = repo.getApplication(app.id)
    const after = repo.deleteStageChange(app.id, entry(before, 1))
    expect({ ...after, stageHistory: [], updatedAt: '' }).toEqual({
      ...before,
      stageHistory: [],
      updatedAt: '',
    })
    expect(after.stageHistory).toHaveLength(2)
  })

  it('rejects the only entry with OnlyStageChangeError (FR-002)', () => {
    const app = withHistory('Dev')
    expect(() => repo.deleteStageChange(app.id, entry(app, 0))).toThrow(OnlyStageChangeError)
    expect(repo.getApplication(app.id).stageHistory).toHaveLength(1)
  })

  it('rejects an entry that changed, is gone, or an unknown application (plan D-1)', () => {
    const app = withHistory('Dev', 'hr_interview')
    const wrong = [
      { ...entry(app, 1), stage: 'offered' as const },
      { ...entry(app, 1), at: '2020-01-01T00:00:00.000Z' },
      { ...entry(app, 1), index: 2 },
    ]
    for (const ref of wrong)
      expect(() => repo.deleteStageChange(app.id, ref)).toThrow(NotFoundError)
    expect(() =>
      repo.deleteStageChange('00000000-0000-4000-8000-999999999999', entry(app, 1)),
    ).toThrow(NotFoundError)
    expect(repo.getApplication(app.id).stageHistory).toEqual(app.stageHistory)
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
    expect(repo.getSettings()).toEqual({
      language: null,
      theme: 'system',
      hiddenStages: [],
      mcpEnabled: false,
      analytics: { period: '30d', grouping: 'day' },
      autoUpdateCheck: false,
      staleAfterDays: 14,
      hiddenSites: [],
      siteQuery: '',
      offerQuestionAnswered: false,
      remindersEnabled: true,
    })
  })

  it('stores language and theme (FR-042, FR-083)', () => {
    repo.setLanguage('uk')
    repo.setTheme('dark')
    expect(repo.getSettings()).toEqual({
      language: 'uk',
      theme: 'dark',
      hiddenStages: [],
      mcpEnabled: false,
      analytics: { period: '30d', grouping: 'day' },
      autoUpdateCheck: false,
      staleAfterDays: 14,
      hiddenSites: [],
      siteQuery: '',
      offerQuestionAnswered: false,
      remindersEnabled: true,
    })
    expect(repo.setTheme('light').theme).toBe('light')
  })

  it('ignores unknown stored values', () => {
    db.prepare("INSERT INTO settings VALUES ('language', 'de'), ('theme', 'neon')").run()
    expect(repo.getSettings()).toEqual({
      language: null,
      theme: 'system',
      hiddenStages: [],
      mcpEnabled: false,
      analytics: { period: '30d', grouping: 'day' },
      autoUpdateCheck: false,
      staleAfterDays: 14,
      hiddenSites: [],
      siteQuery: '',
      offerQuestionAnswered: false,
      remindersEnabled: true,
    })
  })
})

describe('analytics view (spec 005)', () => {
  it('stores the period and grouping (FR-032)', () => {
    expect(repo.setAnalyticsView({ period: 'all', grouping: 'month' }).analytics).toEqual({
      period: 'all',
      grouping: 'month',
    })
    expect(repo.getSettings().analytics).toEqual({ period: 'all', grouping: 'month' })
  })

  it.each(['not json', '{"period":"1y","grouping":"day"}'])(
    'reads a damaged value %s as the default (US-6.1)',
    (value) => {
      db.prepare("INSERT INTO settings VALUES ('analytics', ?)").run(value)
      expect(repo.getSettings().analytics).toEqual({ period: '30d', grouping: 'day' })
    },
  )
})

describe('update check settings (spec 006)', () => {
  it('stores the switch and the time of the last check (FR-002, FR-004)', () => {
    expect(repo.getSettings().autoUpdateCheck).toBe(false)
    expect(repo.setAutoUpdateCheck(true).autoUpdateCheck).toBe(true)
    expect(repo.getLastUpdateCheck()).toBeNull()
    repo.setLastUpdateCheck('2026-11-18T10:00:00.000Z')
    expect(repo.getLastUpdateCheck()).toBe('2026-11-18T10:00:00.000Z')
    expect(repo.getSettings()).not.toHaveProperty('lastUpdateCheckAt')
  })
})

describe('stale settings (spec 010)', () => {
  it('stores N; 14 by default (FR-008, FR-009)', () => {
    expect(repo.getSettings().staleAfterDays).toBe(14)
    expect(repo.setStaleAfterDays(7).staleAfterDays).toBe(7)
    expect(repo.getSettings().staleAfterDays).toBe(7)
  })

  it.each(['abc', '2', '91', '7.5', ''])('reads a damaged value %j as 14', (value) => {
    db.prepare("INSERT INTO settings VALUES ('staleAfterDays', ?)").run(value)
    expect(repo.getSettings().staleAfterDays).toBe(14)
  })

  it('keeps N after a reset of the board (FR-009)', () => {
    repo.setStaleAfterDays(30)
    repo.resetBoard()
    expect(repo.getSettings().staleAfterDays).toBe(30)
  })
})

describe('offer question (spec 013)', () => {
  it('is not answered by default; an answer is kept (FR-004)', () => {
    expect(repo.getSettings().offerQuestionAnswered).toBe(false)
    expect(repo.answerOfferQuestion().offerQuestionAnswered).toBe(true)
    expect(repo.getSettings().offerQuestionAnswered).toBe(true)
  })

  it.each(['false', '1', ''])('reads another value %j as not answered', (value) => {
    db.prepare("INSERT INTO settings VALUES ('offerQuestionAnswered', ?)").run(value)
    expect(repo.getSettings().offerQuestionAnswered).toBe(false)
  })

  it('keeps the answer after a reset of the board (NFR-002)', () => {
    repo.answerOfferQuestion()
    repo.resetBoard()
    expect(repo.getSettings().offerQuestionAnswered).toBe(true)
  })
})

describe('job sites (spec 011)', () => {
  const acme = { name: 'Acme careers', url: 'https://acme.com/careers?q={query}' }

  it('adds, lists in order, updates and deletes the user sites (FR-010…FR-012)', () => {
    const first = repo.addSite(acme)
    const second = repo.addSite({ name: 'Board', url: 'https://jobs.example.com/' })
    expect(repo.listSites()).toEqual([first, second])
    expect(repo.updateSite(first.id, { name: 'Acme', url: 'https://acme.com/' })).toEqual({
      id: first.id,
      name: 'Acme',
      url: 'https://acme.com/',
    })
    repo.deleteSite(second.id)
    expect(repo.listSites()).toEqual([{ id: first.id, name: 'Acme', url: 'https://acme.com/' }])
  })

  it('new sites go after the last one, also after a delete', () => {
    const a = repo.addSite({ ...acme, name: 'A' })
    const b = repo.addSite({ ...acme, name: 'B' })
    repo.deleteSite(a.id)
    const c = repo.addSite({ ...acme, name: 'C' })
    expect(repo.listSites().map((site) => site.id)).toEqual([b.id, c.id])
  })

  it('NOT_FOUND for an unknown site', () => {
    expect(() => repo.updateSite('nope', acme)).toThrow(NotFoundError)
    expect(() => repo.deleteSite('nope')).toThrow(NotFoundError)
  })

  it('allows at most 50 sites (FR-013)', () => {
    for (let i = 0; i < 50; i++) repo.addSite({ ...acme, name: `Site ${i}` })
    expect(() => repo.addSite(acme)).toThrow(SiteLimitError)
    expect(repo.listSites()).toHaveLength(50)
  })

  it('stores hidden known sites and the query; drops unknown ids (FR-005, FR-015)', () => {
    expect(repo.getSettings()).toMatchObject({ hiddenSites: [], siteQuery: '' })
    repo.setHiddenSites(['linkedin', 'indeed', 'linkedin'])
    repo.setSiteQuery('QA Engineer')
    expect(repo.getSettings()).toMatchObject({
      hiddenSites: ['linkedin', 'indeed'],
      siteQuery: 'QA Engineer',
      offerQuestionAnswered: false,
      remindersEnabled: true,
    })
    db.prepare(
      'UPDATE settings SET value = \'["linkedin","myspace",1]\' WHERE key = \'hiddenSites\'',
    ).run()
    expect(repo.getSettings().hiddenSites).toEqual(['linkedin'])
    db.prepare("UPDATE settings SET value = 'not json' WHERE key = 'hiddenSites'").run()
    expect(repo.getSettings().hiddenSites).toEqual([])
  })

  it('saves icons and failed tries by host', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47])
    repo.saveSiteIcon('djinni.co', 'image/png', png)
    repo.markSiteIconFailed('dou.ua')
    expect(repo.siteIcons()).toEqual([
      {
        host: 'djinni.co',
        status: 'ok',
        mime: 'image/png',
        data: png,
        checkedAt: expect.any(String),
      },
      { host: 'dou.ua', status: 'failed', mime: null, data: null, checkedAt: expect.any(String) },
    ])
    repo.saveSiteIcon('dou.ua', 'image/png', png)
    expect(repo.siteIcons().find((icon) => icon.host === 'dou.ua')!.status).toBe('ok')
  })

  it('a reset of the board keeps sites, icons, hidden sites and the query (FR-012)', () => {
    repo.addSite(acme)
    repo.saveSiteIcon('acme.com', 'image/png', new Uint8Array([1]))
    repo.setHiddenSites(['xing'])
    repo.setSiteQuery('QA')
    repo.resetBoard()
    expect(repo.listSites()).toHaveLength(1)
    expect(repo.siteIcons()).toHaveLength(1)
    expect(repo.getSettings()).toMatchObject({ hiddenSites: ['xing'], siteQuery: 'QA' })
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
    expect(repo.getSettings()).toEqual({
      language: 'uk',
      theme: 'dark',
      hiddenStages: [],
      mcpEnabled: false,
      analytics: { period: '30d', grouping: 'day' },
      autoUpdateCheck: false,
      staleAfterDays: 14,
      hiddenSites: [],
      siteQuery: '',
      offerQuestionAnswered: false,
      remindersEnabled: true,
    })
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

describe('shared rules and MCP settings (spec 004)', () => {
  it('the repository itself refuses hidden stages (FR-003)', () => {
    const a = repo.createApplication(input('A'))
    repo.setHiddenStages(['offered'])
    expect(() => repo.moveApplication(a.id, { stage: 'offered', index: 0 })).toThrow(
      HiddenStageError,
    )
    expect(() => repo.createApplication(input('B', { stage: 'offered' }))).toThrow(HiddenStageError)
    expect(repo.getApplication(a.id).stage).toBe('applied')
  })

  it('MCP access is off by default and can be turned on (FR-005)', () => {
    expect(repo.getSettings().mcpEnabled).toBe(false)
    expect(repo.setMcpEnabled(true).mcpEnabled).toBe(true)
    expect(repo.setMcpEnabled(false).mcpEnabled).toBe(false)
  })

  it('getApplication throws NotFoundError for an unknown id', () => {
    expect(() => repo.getApplication('missing')).toThrow(NotFoundError)
  })
})
