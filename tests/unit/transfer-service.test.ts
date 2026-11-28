import { beforeEach, describe, expect, it } from 'vitest'
import { IMPORT_LIMITS } from '../../src/domain/transfer'
import { NotFoundError, type Repository } from '../../src/main/db/repository'
import {
  createTransfer,
  exportFileName,
  transferLabels,
  type Transfer,
} from '../../src/main/transfer'
import { memoryRepository } from './helpers/db'
import { fakeFiles } from './helpers/files'

const PATH = '/home/me/board.csv'
let repo: Repository
let files: ReturnType<typeof fakeFiles>
let transfer: Transfer

beforeEach(() => {
  ;({ repository: repo } = memoryRepository())
  files = fakeFiles()
  transfer = createTransfer({ repository: repo, ...files.deps })
})

describe('labels from the locale files (plan D-3)', () => {
  it('has headers, stage and colour names per language', () => {
    expect(transferLabels('en')).toMatchObject({
      columns: { title: 'Title', notes: 'Notes' },
      stages: { offered: 'Offer' },
      colors: { grey: 'Grey' },
    })
    expect(transferLabels('uk').columns.title).toBe('Назва')
  })
})

describe('export (US-1)', () => {
  it('FR-002: proposes findy-<local date>.csv', () => {
    expect(exportFileName(new Date(2026, 0, 5, 23, 59))).toBe('findy-2026-01-05.csv')
  })

  it('writes the board to the picked file in the language asked for', async () => {
    repo.createApplication({ title: 'Dev', company: 'Acme', url: null })
    expect(await transfer.exportCsv('uk')).toEqual({ status: 'saved', count: 1 })
    expect(files.files[PATH]).toMatch(/^\uFEFFНазва,Компанія,Посилання,Етап/)
    expect(files.files[PATH]).toContain('Dev,Acme,,')
  })

  it('US-1.5: writes nothing when the dialog is cancelled', async () => {
    files.answer(null)
    expect(await transfer.exportCsv('en')).toEqual({ status: 'cancelled' })
    expect(files.files).toEqual({})
  })
})

describe('Polish (spec 026 FR-007)', () => {
  it('exports Polish headers and stage names', async () => {
    const app = repo.createApplication({ title: 'Dev', company: 'Acme', url: null })
    repo.moveApplication(app.id, { stage: 'offered', index: 0 })
    await transfer.exportCsv('pl')
    expect(files.files[PATH]).toMatch(/^\uFEFFStanowisko,Firma,Link,Etap/)
    expect(files.files[PATH]).toContain('Dev,Acme,,Oferta')
  })

  it('imports a Polish file with Polish stage names', async () => {
    files.files[PATH] = 'Stanowisko,Firma,Etap\r\nDev,Acme,Rozmowa techniczna'
    const preview = await transfer.previewImport()
    expect(preview).toMatchObject({ toAdd: 1, fatal: null, errors: [] })
    transfer.confirmImport(preview!.token!)
    expect(repo.listApplications()[0]).toMatchObject({ title: 'Dev', stage: 'technical_interview' })
  })
})

describe('import (US-2)', () => {
  it('US-2.1, 2.3: previews without changes; nothing changes until confirm', async () => {
    files.files[PATH] = 'Title,Company,Stage\r\nDev,Acme,Rejected\r\n,x,\r\nQA,Acme,'
    repo.setHiddenStages(['rejected'])
    const preview = await transfer.previewImport()
    expect(preview).toEqual({
      token: 'token-1',
      fileName: 'board.csv',
      fatal: null,
      toAdd: 2,
      duplicates: 0,
      hidden: 1,
      errors: [{ row: 3, field: 'title', problem: 'required' }],
    })
    expect(repo.listApplications()).toEqual([])

    expect(transfer.confirmImport('token-1')).toBe(2)
    expect(repo.listApplications().map((app) => app.title)).toEqual(['QA', 'Dev'])
  })

  it('a token works once', async () => {
    files.files[PATH] = 'Title,Company\r\nDev,Acme'
    await transfer.previewImport()
    transfer.confirmImport('token-1')
    expect(() => transfer.confirmImport('token-1')).toThrow(NotFoundError)
    expect(() => transfer.confirmImport('other')).toThrow(NotFoundError)
  })

  it('plans again at confirm: a row added meanwhile is a duplicate (edge case)', async () => {
    files.files[PATH] = 'Title,Company\r\nDev,Acme\r\nQA,Acme'
    await transfer.previewImport()
    repo.createApplication({ title: 'Dev', company: 'Acme', url: null })
    expect(transfer.confirmImport('token-1')).toBe(1)
  })

  it('US-2.5: the same file twice adds nothing the second time', async () => {
    files.files[PATH] = 'Title,Company\r\nDev,Acme'
    await transfer.previewImport()
    transfer.confirmImport('token-1')
    expect(await transfer.previewImport()).toMatchObject({ token: null, toAdd: 0, duplicates: 1 })
  })

  it('US-2.7: explains a file that cannot be imported', async () => {
    files.files[PATH] = '"open quote'
    expect(await transfer.previewImport()).toMatchObject({
      token: null,
      fatal: { reason: 'notCsv' },
    })
    files.files[PATH] = 'Name,Employer\r\na,b'
    expect(await transfer.previewImport()).toMatchObject({
      fatal: { reason: 'missingColumns', columns: ['title', 'company'] },
    })
  })

  it('NFR-004: refuses a file over 10 MB without reading it', async () => {
    const big = { ...files.deps, fileSize: async () => IMPORT_LIMITS.bytes + 1 }
    let read = false
    const guarded = createTransfer({
      repository: repo,
      ...big,
      readText: async () => {
        read = true
        return ''
      },
    })
    expect(await guarded.previewImport()).toMatchObject({ fatal: { reason: 'tooLarge' } })
    expect(read).toBe(false)
  })

  it('returns null when the dialog is cancelled, and forgets the last preview', async () => {
    files.files[PATH] = 'Title,Company\r\nDev,Acme'
    await transfer.previewImport()
    files.answer(null)
    expect(await transfer.previewImport()).toBeNull()
    files.answer(PATH)
    files.files[PATH] = 'Title\r\nx'
    await transfer.previewImport()
    expect(() => transfer.confirmImport('token-1')).toThrow(NotFoundError)
  })

  it('SC-001: export, then import into an empty board, gives the same board', async () => {
    const a = repo.createApplication({ title: 'Dev', company: 'Acme', url: 'https://acme.com' })
    repo.moveApplication(a.id, { stage: 'offered', index: 0 })
    repo.setApplicationColor(a.id, 'green')
    repo.addNote(a.id, 'first, "quoted"\nline')
    repo.createApplication({ title: 'QA', company: 'Globex', url: null })
    const before = repo.listApplications()
    await transfer.exportCsv('uk')

    const empty = memoryRepository().repository
    const target = createTransfer({ repository: empty, ...files.deps })
    await target.previewImport()
    target.confirmImport('token-1')

    const strip = (list: typeof before) =>
      list.map(({ title, company, url, stage, order, color, createdAt, stageHistory, notes }) => ({
        title,
        company,
        url,
        stage,
        order,
        color,
        createdAt,
        stageHistory,
        notes: notes.map(({ text, createdAt }) => ({ text, createdAt })),
      }))
    // The fake clock gives whole seconds, so nothing is lost to the second
    expect(strip(empty.listApplications())).toEqual(strip(before))
  })
})
