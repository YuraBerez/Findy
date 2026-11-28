import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type AppState, unwrap } from '../../../src/shared/ipc'
import { type IpcContext, setup, state } from '../helpers/ipc'

describe('CSV export and import (spec 008)', () => {
  let ctx: IpcContext
  beforeEach(() => {
    ctx = setup()
  })

  it('exports, previews and confirms an import', async () => {
    const h = ctx.handlers
    await state(h.createApplication({ title: 'Dev', company: 'Acme' }))
    expect(unwrap(await h.exportCsv('en'))).toEqual({ status: 'saved', count: 1 })
    expect(ctx.files.files['/home/me/board.csv']).toMatch(/^\uFEFFTitle,Company/)

    ctx.files.files['/home/me/board.csv'] = 'Title,Company\r\nQA,Globex\r\nDev,Acme'
    expect(unwrap(await h.previewImport())).toMatchObject({
      token: 'token-1',
      fileName: 'board.csv',
      toAdd: 1,
      duplicates: 1,
    })
    const result = unwrap(await h.confirmImport('token-1')) as { state: AppState; added: number }
    expect(result.added).toBe(1)
    expect(result.state.applications.map((app) => app.title)).toEqual(['QA', 'Dev'])
  })

  it('an unknown import token is NOT_FOUND; a bad language is VALIDATION', async () => {
    expect(await ctx.handlers.confirmImport('nope')).toMatchObject({
      ok: false,
      error: { code: 'NOT_FOUND' },
    })
    expect(await ctx.handlers.exportCsv('de')).toMatchObject({
      ok: false,
      error: { code: 'VALIDATION' },
    })
  })
})

describe('saveSkill (spec 016)', () => {
  it('saves without a database and reports a failed write as STORAGE (FR-021, FR-022)', async () => {
    const { handlers } = setup({ repository: null, transfer: null })
    expect(unwrap(await handlers.saveSkill())).toEqual({ status: 'saved' })
    const failing = setup({
      saveSkill: vi.fn(async () => {
        throw new Error('EACCES')
      }),
    })
    expect(await failing.handlers.saveSkill()).toMatchObject({
      ok: false,
      error: { code: 'STORAGE' },
    })
    expect(await failing.handlers.saveSkill('extra')).toMatchObject({
      ok: false,
      error: { code: 'VALIDATION' },
    })
  })
})

describe('copyImage and saveImage (spec 023)', () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0])

  it('copies and saves a PNG without a database (FR-021, FR-022)', async () => {
    const { deps, handlers } = setup({ repository: null, transfer: null })
    expect(await handlers.copyImage(png)).toEqual({ ok: true, data: undefined })
    expect(deps.image.copy).toHaveBeenCalledWith(png)
    expect(unwrap(await handlers.saveImage(png))).toEqual({ status: 'saved' })
    expect(deps.image.save).toHaveBeenCalledWith(png)
  })

  it('refuses bytes that are not a PNG, and a PNG over 5 MB (plan D-2)', async () => {
    const { deps, handlers } = setup()
    const large = new Uint8Array(5 * 1024 * 1024 + 1)
    large.set(png)
    for (const bad of [
      'text',
      new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]),
      png.slice(0, 8),
      large,
    ]) {
      expect(await handlers.copyImage(bad)).toMatchObject({
        ok: false,
        error: { code: 'VALIDATION' },
      })
      expect(await handlers.saveImage(bad)).toMatchObject({
        ok: false,
        error: { code: 'VALIDATION' },
      })
    }
    expect(deps.image.copy).not.toHaveBeenCalled()
    expect(deps.image.save).not.toHaveBeenCalled()
  })

  it('reports a failed copy or write as STORAGE (FR-023)', async () => {
    const { handlers } = setup({
      image: {
        copy: vi.fn(async () => {
          throw new Error('The image cannot be decoded')
        }),
        save: vi.fn(async () => {
          throw new Error('EACCES')
        }),
      },
    })
    expect(await handlers.copyImage(png)).toMatchObject({ ok: false, error: { code: 'STORAGE' } })
    expect(await handlers.saveImage(png)).toMatchObject({ ok: false, error: { code: 'STORAGE' } })
  })
})
