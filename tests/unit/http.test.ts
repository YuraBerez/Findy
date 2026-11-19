import { describe, expect, it, vi } from 'vitest'
import { fetchLimited, type FetchLimits, type HttpFetch } from '../../src/main/http'

const LIMITS: FetchLimits = { timeoutMs: 1000, maxBytes: 100, maxRedirects: 5, accept: 'image/*' }

function fakeFetch(...answers: Response[]) {
  return vi.fn<HttpFetch>(async () => answers.shift() ?? new Response(null, { status: 599 }))
}

const redirect = (location: string) => new Response(null, { status: 302, headers: { location } })

describe('fetchLimited (spec 009 D-2, spec 011 plan D-3)', () => {
  it('reads any type when no types are given, and reports the final address', async () => {
    const fetch = fakeFetch(
      redirect('https://www.example.com/favicon.ico'),
      new Response(new Uint8Array([0, 0, 1, 0]), { headers: { 'content-type': 'text/plain' } }),
    )
    expect(await fetchLimited(fetch, 'https://example.com/favicon.ico', LIMITS)).toEqual({
      bytes: new Uint8Array([0, 0, 1, 0]),
      contentType: 'text/plain',
      url: 'https://www.example.com/favicon.ico',
    })
    expect(fetch.mock.calls[0]![1]).toMatchObject({ headers: { Accept: 'image/*' } })
  })

  it('asks allowRedirect for each redirect and stops when it refuses', async () => {
    const allowRedirect = vi.fn((from: URL, to: URL) => to.hostname.endsWith('example.com'))
    const fetch = fakeFetch(redirect('https://tracker.example.net/x'), new Response('never'))
    expect(
      await fetchLimited(fetch, 'https://example.com/', { ...LIMITS, allowRedirect }),
    ).toBeNull()
    expect(allowRedirect).toHaveBeenCalledWith(
      new URL('https://example.com/'),
      new URL('https://tracker.example.net/x'),
    )
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('never asks allowRedirect for a non-http redirect', async () => {
    const allowRedirect = vi.fn(() => true)
    const fetch = fakeFetch(redirect('file:///etc/hosts'))
    expect(
      await fetchLimited(fetch, 'https://example.com/', { ...LIMITS, allowRedirect }),
    ).toBeNull()
    expect(allowRedirect).not.toHaveBeenCalled()
  })
})
