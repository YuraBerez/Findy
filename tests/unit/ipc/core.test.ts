import { beforeEach, describe, expect, it, vi } from 'vitest'
import { errorKind, getIpcErrorCode, IpcError, unwrap } from '../../../src/shared/ipc'
import { memoryRepository } from '../helpers/db'
import { DEFAULT_SETTINGS, type IpcContext, okStorage, setup, state } from '../helpers/ipc'

describe('IPC handlers', () => {
  let ctx: IpcContext
  beforeEach(() => {
    ctx = setup()
  })

  it('returns the full state', async () => {
    expect(await state(ctx.handlers.getState())).toEqual({
      settings: DEFAULT_SETTINGS,
      applications: [],
      sites: [],
      storage: okStorage,
    })
  })

  it('saves settings and applies the theme (FR-082)', async () => {
    await state(ctx.handlers.setLanguage('uk'))
    const s = await state(ctx.handlers.setTheme('dark'))
    expect(s.settings).toEqual({ ...DEFAULT_SETTINGS, language: 'uk', theme: 'dark' })
    expect(ctx.deps.applyTheme).toHaveBeenCalledWith('dark')
    expect(ctx.deps.applyLanguage).toHaveBeenCalledWith('uk')
  })

  it.each([
    ['createApplication', [{ title: '', company: 'x' }]],
    ['createApplication', [{ title: 'a', company: 'b', url: 'ftp://x' }]],
    ['createApplication', []],
    ['updateApplication', ['not-a-uuid', {}]],
    ['setApplicationColor', ['00000000-0000-4000-8000-000000000001', 'pink']],
    ['setApplicationColor', ['00000000-0000-4000-8000-000000000001']],
    ['moveApplication', ['00000000-0000-4000-8000-000000000001', { stage: 'nope', index: 0 }]],
    ['addNote', ['00000000-0000-4000-8000-000000000001', '']],
    ['setLanguage', ['de']],
    ['setTheme', ['neon']],
    ['openExternal', ['file:///etc/passwd']],
    ['openExternal', ['javascript:alert(1)']],
  ] as const)('%s rejects invalid input %j with VALIDATION', async (method, args) => {
    const result = await ctx.handlers[method](...args)
    expect(result).toMatchObject({ ok: false, error: { code: 'VALIDATION' } })
  })

  it('maps unknown ids to NOT_FOUND', async () => {
    const result = await ctx.handlers.deleteApplication('00000000-0000-4000-8000-000000000099')
    expect(result).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } })
  })

  it('opens only http(s) links in the system browser (FR-015)', async () => {
    unwrap(await ctx.handlers.openExternal('https://acme.com/jobs/1'))
    expect(ctx.deps.openExternal).toHaveBeenCalledWith('https://acme.com/jobs/1')
  })

  it('reports system locale and app info', async () => {
    expect(unwrap(await ctx.handlers.getSystemLocale())).toBe('uk-UA')
    expect(unwrap(await ctx.handlers.getAppInfo())).toEqual({
      version: '0.1.0',
      dataFilePath: '/data/findy.db',
    })
  })
})

describe('IPC handlers without storage (FR-054)', () => {
  const storage = {
    status: 'error' as const,
    error: 'corrupt' as const,
    dataFilePath: '/data/findy.db',
    backupPath: '/data/findy.corrupt.db',
  }

  it('returns an empty state with the storage error', async () => {
    const { handlers } = setup({ repository: null, storage })
    expect(await state(handlers.getState())).toEqual({
      settings: DEFAULT_SETTINGS,
      applications: [],
      sites: [],
      storage,
    })
  })

  it('rejects every mutation with STORAGE', async () => {
    const { handlers } = setup({ repository: null, transfer: null, storage })
    const result = await handlers.createApplication({ title: 'a', company: 'b' })
    expect(result).toMatchObject({ ok: false, error: { code: 'STORAGE' } })
    expect(await handlers.previewImport()).toMatchObject({ ok: false, error: { code: 'STORAGE' } })
    expect(await handlers.setTheme('dark')).toMatchObject({ ok: false })
  })
})

describe('unwrap', () => {
  it('throws an IpcError with the code', () => {
    expect(() => unwrap({ ok: false, error: { code: 'NOT_FOUND', message: 'gone' } })).toThrow(
      expect.objectContaining({ name: 'IpcError', code: 'NOT_FOUND', message: 'NOT_FOUND: gone' }),
    )
    expect(new IpcError({ code: 'STORAGE', message: 'x' })).toBeInstanceOf(Error)
  })

  it('recovers the code from a message that crossed contextBridge', () => {
    expect(getIpcErrorCode(new Error('Error invoking remote method: VALIDATION: bad'))).toBe(
      'VALIDATION',
    )
    expect(getIpcErrorCode(new IpcError({ code: 'STORAGE', message: 'x' }))).toBe('STORAGE')
    expect(getIpcErrorCode('plain failure')).toBeNull()
  })

  it('maps non-Error throws to STORAGE', async () => {
    const { repository } = memoryRepository()
    vi.spyOn(repository, 'listApplications').mockImplementation(() => {
      throw 'disk on fire'
    })
    const { handlers } = setup({ repository })
    expect(await handlers.getState()).toEqual({
      ok: false,
      error: { code: 'STORAGE', message: 'disk on fire' },
    })
  })
})

describe('errorKind (spec 003 FR-002)', () => {
  it.each([
    [new IpcError({ code: 'VALIDATION', message: 'x' }), 'validation'],
    [new Error('Error invoking remote method: NOT_FOUND: gone'), 'notFound'],
    [new IpcError({ code: 'STORAGE', message: 'disk' }), 'storage'],
    [new TypeError('window.findy.resetBoard is not a function'), 'unknown'],
    ['plain string', 'unknown'],
  ])('%s → %s', (error, kind) => {
    expect(errorKind(error)).toBe(kind)
  })
})
