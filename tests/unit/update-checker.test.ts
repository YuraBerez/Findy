import { describe, expect, it, vi } from 'vitest'
import {
  createUpdateChecker,
  fetchLatestRelease,
  UpdateCheckError,
  type LatestRelease,
} from '../../src/main/updates'
import { LATEST_RELEASE_API_URL, releasePageUrl } from '../../src/shared/project'

const PAGE = releasePageUrl('v0.2.0')
const release = (extra: object = {}) => ({
  tag_name: 'v0.2.0',
  html_url: PAGE,
  draft: false,
  prerelease: false,
  body: 'notes',
  ...extra,
})

function fakeFetch(body: unknown, status = 200) {
  const text = typeof body === 'string' ? body : JSON.stringify(body)
  return vi.fn(async () => new Response(text, { status })) as unknown as typeof fetch &
    ReturnType<typeof vi.fn>
}

describe('fetchLatestRelease (spec 006 FR-005, FR-011, FR-012)', () => {
  it('reads the latest stable release with one anonymous GET', async () => {
    const fetchFn = fakeFetch(release())
    expect(await fetchLatestRelease(fetchFn)).toEqual({ version: '0.2.0', url: PAGE })
    const [url, init] = fetchFn.mock.calls[0]!
    expect(url).toBe(LATEST_RELEASE_API_URL)
    expect(init.method).toBeUndefined() // GET
    expect(init.body).toBeUndefined() // FR-011: nothing sent
    expect(Object.keys(init.headers)).toEqual(['Accept', 'User-Agent'])
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it('uses another URL when given (e2e)', async () => {
    const fetchFn = fakeFetch(release())
    await fetchLatestRelease(fetchFn, { url: 'http://127.0.0.1:9/latest' })
    expect(fetchFn.mock.calls[0]![0]).toBe('http://127.0.0.1:9/latest')
  })

  it.each([
    ['an error status', fakeFetch({ message: 'rate limit' }, 403), /HTTP 403/],
    ['not JSON', fakeFetch('<html>'), /not JSON/],
    ['not a release', fakeFetch({ name: 'x' }), /not a release/],
    ['a draft', fakeFetch(release({ draft: true })), /stable/],
    ['a pre-release', fakeFetch(release({ prerelease: true })), /stable/],
    ['an invalid tag', fakeFetch(release({ tag_name: 'nightly' })), /Not a version/],
    [
      'a page outside the repository',
      fakeFetch(release({ html_url: 'https://evil.example/findy/releases/1' })),
      /repository/,
    ],
    ['a huge answer', fakeFetch('x'.repeat(1_000_001)), /too large/],
    [
      'a huge declared size',
      vi.fn(
        async () => new Response('{}', { headers: { 'Content-Length': '5000000' } }),
      ) as unknown as typeof fetch,
      /too large/,
    ],
  ])('rejects %s', async (_name, fetchFn, message) => {
    await expect(fetchLatestRelease(fetchFn)).rejects.toThrow(message)
    await expect(fetchLatestRelease(fetchFn)).rejects.toBeInstanceOf(UpdateCheckError)
  })

  it('turns a network failure or a timeout into UpdateCheckError', async () => {
    const offline = vi.fn(async () => {
      throw new TypeError('fetch failed')
    }) as unknown as typeof fetch
    await expect(fetchLatestRelease(offline)).rejects.toThrow(UpdateCheckError)
    const slow = vi.fn(
      (_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_, reject) =>
          init!.signal!.addEventListener('abort', () => reject(init!.signal!.reason)),
        ),
    ) as unknown as typeof fetch
    await expect(fetchLatestRelease(slow, { timeoutMs: 10 })).rejects.toThrow(UpdateCheckError)
  })
})

function checker(
  options: {
    auto?: boolean
    last?: string | null
    latest?: () => Promise<LatestRelease>
    noSettings?: boolean
  } = {},
) {
  let last = options.last ?? null
  const recordCheck = vi.fn((at: string) => {
    last = at
  })
  const fetchLatest = vi.fn(options.latest ?? (async () => ({ version: '0.2.0', url: PAGE })))
  const check = createUpdateChecker({
    fetchLatest,
    currentVersion: '0.1.1',
    now: () => new Date('2026-11-18T12:00:00.000Z'),
    settings: options.noSettings
      ? null
      : { autoCheck: () => options.auto ?? false, lastCheck: () => last, recordCheck },
  })
  return { check, fetchLatest, recordCheck }
}

describe('createUpdateChecker (FR-003, FR-004, FR-009, FR-010)', () => {
  it('a manual check always runs and says what it found (US-1.1, US-1.2)', async () => {
    const { check, recordCheck } = checker()
    expect(await check('manual')).toEqual({
      status: 'available',
      version: '0.2.0',
      currentVersion: '0.1.1',
      url: PAGE,
    })
    expect(recordCheck).toHaveBeenCalledWith('2026-11-18T12:00:00.000Z')
    const same = checker({ latest: async () => ({ version: '0.1.1', url: PAGE }) })
    expect(await same.check('manual')).toEqual({ status: 'latest', currentVersion: '0.1.1' })
  })

  it('a manual check reports a failure (US-1.3)', async () => {
    const { check, recordCheck } = checker({
      latest: async () => {
        throw new UpdateCheckError('offline')
      },
    })
    await expect(check('manual')).rejects.toThrow('offline')
    expect(recordCheck).toHaveBeenCalled()
    const odd = checker({
      latest: async () => {
        throw 'weird'
      },
    })
    await expect(odd.check('manual')).rejects.toBeInstanceOf(UpdateCheckError)
  })

  it('makes no request while the automatic check is off (US-2.1, FR-003)', async () => {
    const { check, fetchLatest } = checker({ auto: false })
    expect(await check('auto')).toBeNull()
    expect(fetchLatest).not.toHaveBeenCalled()
    const noDb = checker({ noSettings: true })
    expect(await noDb.check('auto')).toBeNull()
    expect(noDb.fetchLatest).not.toHaveBeenCalled()
    expect((await noDb.check('manual'))?.status).toBe('available')
  })

  it('checks automatically only when 24 hours passed (US-2.2, US-2.3)', async () => {
    const recent = checker({ auto: true, last: '2026-11-18T01:00:00.000Z' })
    expect(await recent.check('auto')).toBeNull()
    expect(recent.fetchLatest).not.toHaveBeenCalled()
    const due = checker({ auto: true, last: '2026-11-17T11:00:00.000Z' })
    expect((await due.check('auto'))?.status).toBe('available')
  })

  it('an automatic check never fails (US-2.6)', async () => {
    const { check, recordCheck } = checker({
      auto: true,
      latest: async () => {
        throw new UpdateCheckError('offline')
      },
    })
    expect(await check('auto')).toBeNull()
    expect(recordCheck).toHaveBeenCalled()
  })

  it('runs one request at a time', async () => {
    let resolve!: (release: LatestRelease) => void
    const { check, fetchLatest } = checker({
      auto: true,
      latest: () => new Promise((done) => (resolve = done)),
    })
    const both = Promise.all([check('auto'), check('manual')])
    resolve({ version: '0.2.0', url: PAGE })
    const [auto, manual] = await both
    expect(fetchLatest).toHaveBeenCalledTimes(1)
    expect(auto).toEqual(manual)
  })
})
