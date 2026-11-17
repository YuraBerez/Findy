import { afterEach, describe, expect, it, vi } from 'vitest'
import { runSmokeTest } from '../../src/main/smoke'

describe('runSmokeTest', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.doUnmock('better-sqlite3')
    vi.resetModules()
  })

  it('returns 0 and reports the SQLite version', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    expect(runSmokeTest()).toBe(0)
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/^FINDY_SMOKE_OK sqlite=\d+\.\d+/))
  })

  it('returns 1 when the native module fails', async () => {
    vi.doMock('better-sqlite3', () => ({
      default: vi.fn(function () {
        throw new Error('binding missing')
      }),
    }))
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { runSmokeTest: run } = await import('../../src/main/smoke')
    expect(run()).toBe(1)
    expect(error).toHaveBeenCalledWith('FINDY_SMOKE_FAIL', expect.any(Error))
  })
})
