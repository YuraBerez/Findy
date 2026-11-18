import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createHandlers, type IpcDeps } from '../../src/main/ipc'
import {
  errorKind,
  getIpcErrorCode,
  IpcError,
  type AppState,
  type IpcResult,
  unwrap,
} from '../../src/shared/ipc'
import { memoryRepository } from './helpers/db'

const okStorage = { status: 'ok' as const, dataFilePath: '/data/findy.db' }

function setup(overrides: Partial<IpcDeps> = {}) {
  const { repository } = memoryRepository()
  const deps: IpcDeps = {
    repository,
    storage: okStorage,
    appVersion: '0.1.0',
    getSystemLocale: () => 'uk-UA',
    openExternal: vi.fn(async () => {}),
    applyTheme: vi.fn(),
    applyLanguage: vi.fn(),
    backup: vi.fn(),
    mcpConnection: () => ({
      command: '/Applications/Findy.app/Contents/MacOS/Findy',
      args: ['--mcp'],
      env: {},
    }),
    ...overrides,
  }
  return { deps, handlers: createHandlers(deps) }
}

const state = async (result: Promise<IpcResult<unknown>>) => unwrap(await result) as AppState

describe('IPC handlers', () => {
  let ctx: ReturnType<typeof setup>
  beforeEach(() => {
    ctx = setup()
  })

  it('returns the full state', async () => {
    expect(await state(ctx.handlers.getState())).toEqual({
      settings: {
        language: null,
        theme: 'system',
        hiddenStages: [],
        mcpEnabled: false,
        analytics: { period: '30d', grouping: 'day' },
        autoUpdateCheck: false,
      },
      applications: [],
      storage: okStorage,
    })
  })

  it('runs the whole application and note lifecycle', async () => {
    const h = ctx.handlers
    let s = await state(h.createApplication({ title: ' Dev ', company: 'Acme', url: '' }))
    const id = s.applications[0]!.id
    expect(s.applications[0]).toMatchObject({ title: 'Dev', url: null })

    s = await state(h.updateApplication(id, { company: 'Globex' }))
    expect(s.applications[0]?.company).toBe('Globex')

    s = await state(h.moveApplication(id, { stage: 'offered', index: 0 }))
    expect(s.applications[0]?.stage).toBe('offered')

    s = await state(h.addNote(id, 'call'))
    const noteId = s.applications[0]!.notes[0]!.id
    s = await state(h.updateNote(id, noteId, 'call done'))
    expect(s.applications[0]?.notes[0]?.text).toBe('call done')
    s = await state(h.deleteNote(id, noteId))
    expect(s.applications[0]?.notes).toEqual([])

    s = await state(h.deleteApplication(id))
    expect(s.applications).toEqual([])
  })

  it('saves settings and applies the theme (FR-082)', async () => {
    await state(ctx.handlers.setLanguage('uk'))
    const s = await state(ctx.handlers.setTheme('dark'))
    expect(s.settings).toEqual({
      language: 'uk',
      theme: 'dark',
      hiddenStages: [],
      mcpEnabled: false,
      analytics: { period: '30d', grouping: 'day' },
      autoUpdateCheck: false,
    })
    expect(ctx.deps.applyTheme).toHaveBeenCalledWith('dark')
    expect(ctx.deps.applyLanguage).toHaveBeenCalledWith('uk')
  })

  it.each([
    ['createApplication', [{ title: '', company: 'x' }]],
    ['createApplication', [{ title: 'a', company: 'b', url: 'ftp://x' }]],
    ['createApplication', []],
    ['updateApplication', ['not-a-uuid', {}]],
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

describe('hidden stages (spec 002)', () => {
  it('saves hidden stages and keeps them over a reset', async () => {
    const ctx = setup()
    let s = await state(ctx.handlers.setHiddenStages(['rejected']))
    expect(s.settings.hiddenStages).toEqual(['rejected'])
    s = await state(ctx.handlers.resetBoard())
    expect(s.settings.hiddenStages).toEqual(['rejected'])
  })

  it('rejects hiding every stage and duplicates (FR-006)', async () => {
    const ctx = setup()
    const all = [
      'applied',
      'hr_interview',
      'test_task',
      'technical_interview',
      'c_level_interview',
      'offered',
      'rejected',
    ]
    expect(await ctx.handlers.setHiddenStages(all)).toMatchObject({
      ok: false,
      error: { code: 'VALIDATION' },
    })
    expect(await ctx.handlers.setHiddenStages(['rejected', 'rejected'])).toMatchObject({
      ok: false,
    })
  })

  it('rejects creating or moving into a hidden stage (FR-006)', async () => {
    const ctx = setup()
    const s = await state(ctx.handlers.createApplication({ title: 'a', company: 'b' }))
    const id = s.applications[0]!.id
    await state(ctx.handlers.setHiddenStages(['offered']))
    expect(await ctx.handlers.moveApplication(id, { stage: 'offered', index: 0 })).toMatchObject({
      ok: false,
      error: { code: 'VALIDATION' },
    })
    expect(
      await ctx.handlers.createApplication({ title: 'x', company: 'y', stage: 'offered' }),
    ).toMatchObject({
      ok: false,
      error: { code: 'VALIDATION' },
    })
    // a visible stage still works
    expect(await ctx.handlers.moveApplication(id, { stage: 'rejected', index: 0 })).toMatchObject({
      ok: true,
    })
  })
})

describe('analytics view (spec 005, FR-030…FR-032)', () => {
  it('saves the period and grouping, and rejects unknown values', async () => {
    const ctx = setup()
    const view = { period: '90d', grouping: 'week' }
    expect((await state(ctx.handlers.setAnalyticsView(view))).settings.analytics).toEqual(view)
    expect(await ctx.handlers.setAnalyticsView({ period: '1y', grouping: 'day' })).toMatchObject({
      ok: false,
      error: { code: 'VALIDATION' },
    })
    expect(await ctx.handlers.setAnalyticsView({ period: 'all' })).toMatchObject({ ok: false })
  })
})

describe('automatic update check (spec 006 FR-002)', () => {
  it('turns it on and off and rejects other values', async () => {
    const ctx = setup()
    expect((await state(ctx.handlers.setAutoUpdateCheck(true))).settings.autoUpdateCheck).toBe(true)
    expect((await state(ctx.handlers.setAutoUpdateCheck(false))).settings.autoUpdateCheck).toBe(
      false,
    )
    expect(await ctx.handlers.setAutoUpdateCheck('on')).toMatchObject({
      ok: false,
      error: { code: 'VALIDATION' },
    })
  })
})

describe('MCP settings (spec 004)', () => {
  it('turns access on and off and gives the connection command', async () => {
    const ctx = setup()
    expect((await state(ctx.handlers.setMcpEnabled(true))).settings.mcpEnabled).toBe(true)
    expect((await state(ctx.handlers.setMcpEnabled(false))).settings.mcpEnabled).toBe(false)
    expect(await ctx.handlers.setMcpEnabled('yes')).toMatchObject({
      ok: false,
      error: { code: 'VALIDATION' },
    })
    expect(unwrap(await ctx.handlers.getMcpConnection())).toEqual({
      command: '/Applications/Findy.app/Contents/MacOS/Findy',
      args: ['--mcp'],
      env: {},
    })
  })
})

describe('resetBoard (FR-090…093)', () => {
  it('backs up first, then deletes all applications', async () => {
    const order: string[] = []
    const ctx = setup({ backup: vi.fn(() => order.push('backup')) })
    await state(ctx.handlers.createApplication({ title: 'a', company: 'b' }))
    const s = await state(ctx.handlers.resetBoard())
    expect(order).toEqual(['backup'])
    expect(ctx.deps.backup).toHaveBeenCalledWith('reset')
    expect(s.applications).toEqual([])
  })

  it('deletes nothing when the backup fails', async () => {
    const ctx = setup({
      backup: vi.fn(() => {
        throw new Error('disk full')
      }),
    })
    await state(ctx.handlers.createApplication({ title: 'a', company: 'b' }))
    expect(await ctx.handlers.resetBoard()).toMatchObject({ ok: false, error: { code: 'STORAGE' } })
    expect((await state(ctx.handlers.getState())).applications).toHaveLength(1)
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
      settings: {
        language: null,
        theme: 'system',
        hiddenStages: [],
        mcpEnabled: false,
        analytics: { period: '30d', grouping: 'day' },
        autoUpdateCheck: false,
      },
      applications: [],
      storage,
    })
  })

  it('rejects every mutation with STORAGE', async () => {
    const { handlers } = setup({ repository: null, storage })
    const result = await handlers.createApplication({ title: 'a', company: 'b' })
    expect(result).toMatchObject({ ok: false, error: { code: 'STORAGE' } })
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
