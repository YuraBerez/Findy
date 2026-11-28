import { describe, expect, it } from 'vitest'
import { unwrap } from '../../../src/shared/ipc'
import { setup, state } from '../helpers/ipc'

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

describe('setStaleAfterDays (spec 010 FR-008)', () => {
  it('saves N and returns the state', async () => {
    const ctx = setup()
    expect((await state(ctx.handlers.setStaleAfterDays(21))).settings.staleAfterDays).toBe(21)
  })

  it.each([2, 91, 7.5, '14', null])('rejects %s with VALIDATION', async (days) => {
    const ctx = setup()
    expect(await ctx.handlers.setStaleAfterDays(days)).toMatchObject({
      ok: false,
      error: { code: 'VALIDATION' },
    })
    expect((await state(ctx.handlers.getState())).settings.staleAfterDays).toBe(14)
  })
})

describe('answerOfferQuestion (spec 013 FR-004)', () => {
  it('remembers the answer and returns the state', async () => {
    const ctx = setup()
    expect((await state(ctx.handlers.getState())).settings.offerQuestionAnswered).toBe(false)
    expect((await state(ctx.handlers.answerOfferQuestion())).settings.offerQuestionAnswered).toBe(
      true,
    )
  })

  it('rejects arguments with VALIDATION', async () => {
    const ctx = setup()
    expect(await ctx.handlers.answerOfferQuestion('no')).toMatchObject({
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
