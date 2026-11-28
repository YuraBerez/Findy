import { describe, expect, it, vi } from 'vitest'
import { errorKind, IpcError, unwrap } from '../../../src/shared/ipc'
import { UpdateCheckError } from '../../../src/main/updates'
import { setup } from '../helpers/ipc'

describe('readVacancy (spec 009)', () => {
  it('passes an http(s) link to the reader and returns its result', async () => {
    const ctx = setup()
    expect(unwrap(await ctx.handlers.readVacancy('https://jobs.example.com/1'))).toEqual({
      title: 'Frontend Developer',
      company: 'Acme',
    })
    expect(ctx.deps.readVacancy).toHaveBeenCalledWith('https://jobs.example.com/1')
  })

  it('resolves null when the page gives nothing (FR-006: not an error)', async () => {
    const ctx = setup({ readVacancy: vi.fn(async () => null) })
    expect(await ctx.handlers.readVacancy('http://example.com')).toEqual({ ok: true, data: null })
  })

  it.each([
    'file:///etc/passwd',
    'javascript:alert(1)',
    'not a link',
    42,
    `https://a.com/${'x'.repeat(2048)}`,
  ])('rejects %s with VALIDATION and reads nothing', async (url) => {
    const ctx = setup()
    expect(await ctx.handlers.readVacancy(url)).toMatchObject({
      ok: false,
      error: { code: 'VALIDATION' },
    })
    expect(ctx.deps.readVacancy).not.toHaveBeenCalled()
  })
})

describe('checkForUpdates (spec 006)', () => {
  it('passes the trigger and returns the result', async () => {
    const ctx = setup()
    expect(unwrap(await ctx.handlers.checkForUpdates('manual'))).toEqual({
      status: 'latest',
      currentVersion: '0.1.0',
    })
    expect(ctx.deps.checkForUpdates).toHaveBeenCalledWith('manual')
    expect(await ctx.handlers.checkForUpdates('weekly')).toMatchObject({
      ok: false,
      error: { code: 'VALIDATION' },
    })
  })

  it('reports a failed check as NETWORK (FR-009)', async () => {
    const ctx = setup({
      checkForUpdates: vi.fn(async () => {
        throw new UpdateCheckError('offline')
      }),
    })
    const result = await ctx.handlers.checkForUpdates('manual')
    expect(result).toEqual({ ok: false, error: { code: 'NETWORK', message: 'offline' } })
    expect(errorKind(new IpcError({ code: 'NETWORK', message: 'offline' }))).toBe('network')
  })
})
