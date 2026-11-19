import { describe, expect, it, vi } from 'vitest'
import type { HttpFetch } from '../../src/main/http'
import { createIconFetcher, sameSite } from '../../src/main/siteIcons'
import { memoryRepository } from './helpers/db'

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3])
const ICO = new Uint8Array([0x00, 0x00, 0x01, 0x00, 9, 9])
const SVG = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>')

/** A new response for every request (a cloned one would share its stream) */
type Route = (() => Response) | Error

/** A fake web: each URL answers with its route; unknown URLs give 404 */
function fakeWeb(routes: Record<string, Route>) {
  return vi.fn<HttpFetch>(async (url) => {
    const route = routes[url]
    if (route instanceof Error) throw route
    return route ? route() : new Response(null, { status: 404 })
  })
}

const html = (head: string) => () =>
  new Response(`<html><head>${head}</head></html>`, { headers: { 'content-type': 'text/html' } })
const image =
  (bytes: Uint8Array, type = 'image/png') =>
  () =>
    new Response(bytes, { headers: { 'content-type': type } })
const redirect = (location: string) => () =>
  new Response(null, { status: 301, headers: { location } })

function setup(routes: Record<string, Route>, now = new Date('2026-11-19T12:00:00Z')) {
  const { repository } = memoryRepository()
  const onChange = vi.fn()
  const clock = { now }
  const fetchFn = fakeWeb(routes)
  const fetcher = createIconFetcher({ fetchFn, store: repository, onChange, now: () => clock.now })
  return { fetcher, fetchFn, onChange, repository, clock }
}

describe('sameSite (spec 011 plan D-3, NFR-001)', () => {
  it.each([
    ['https://linkedin.com/', 'https://www.linkedin.com/x', true],
    ['https://djinni.co/', 'https://static.djinni.co/i.png', true],
    ['https://jobs.dou.ua/', 'https://dou.ua/favicon.ico', true],
    ['https://acme.com/', 'https://cdn.example.net/i.png', false],
    ['https://acme.com/', 'https://notacme.com/', false],
  ])('%s → %s: %s', (from, to, same) => {
    expect(sameSite(new URL(from), new URL(to))).toBe(same)
  })
})

describe('icon fetcher (spec 011 FR-021…FR-023)', () => {
  it('takes the declared icon of the home page, saves it and tells the renderer', async () => {
    const { fetcher, fetchFn, onChange } = setup({
      'https://acme.com/': redirect('https://www.acme.com/'),
      'https://www.acme.com/': html('<link rel="icon" href="/img/icon.png">'),
      'https://www.acme.com/img/icon.png': image(PNG, 'application/octet-stream'),
    })
    await fetcher.refresh(['acme.com'])
    expect(fetcher.icons()).toEqual({
      'acme.com': `data:image/png;base64,${Buffer.from(PNG).toString('base64')}`,
    })
    expect(onChange).toHaveBeenCalledOnce()
    // FR-021: once — a saved icon is not downloaded again
    await fetcher.refresh(['acme.com'])
    expect(fetchFn).toHaveBeenCalledTimes(3)
  })

  it('falls back to /favicon.ico when no icon is declared or it is not an image', async () => {
    const { fetcher } = setup({
      'https://a.com/': html('<link rel="icon" href="/fake.png">'),
      'https://a.com/fake.png': image(SVG, 'image/png'),
      'https://a.com/favicon.ico': image(ICO, 'image/x-icon'),
    })
    await fetcher.refresh(['a.com'])
    expect(Object.keys(fetcher.icons())).toEqual(['a.com'])
    expect(fetcher.icons()['a.com']).toMatch(/^data:image\/x-icon;base64,/)
  })

  it('tries /favicon.ico also when the home page fails', async () => {
    const { fetcher } = setup({
      'https://b.com/': new TypeError('fetch failed'),
      'https://b.com/favicon.ico': image(ICO),
    })
    await fetcher.refresh(['b.com'])
    expect(Object.keys(fetcher.icons())).toEqual(['b.com'])
  })

  it('never requests another site, also not a declared CDN icon (NFR-001)', async () => {
    const { fetcher, fetchFn } = setup({
      'https://c.com/': html('<link rel="icon" href="https://cdn.other.net/c.png">'),
      'https://c.com/favicon.ico': redirect('https://tracker.other.net/i.ico'),
    })
    await fetcher.refresh(['c.com'])
    expect(fetchFn.mock.calls.map(([url]) => url)).toEqual([
      'https://c.com/',
      'https://c.com/favicon.ico',
    ])
    expect(fetcher.icons()).toEqual({})
  })

  it('refuses SVG and large images; marks the host failed (FR-022)', async () => {
    const { fetcher, repository } = setup({
      'https://d.com/favicon.ico': image(SVG, 'image/svg+xml'),
      'https://e.com/favicon.ico': image(new Uint8Array(100 * 1024 + 1).fill(0x89)),
    })
    await fetcher.refresh(['d.com', 'e.com'])
    expect(fetcher.icons()).toEqual({})
    expect(repository.siteIcons().map((icon) => [icon.host, icon.status])).toEqual([
      ['d.com', 'failed'],
      ['e.com', 'failed'],
    ])
  })

  it('tries a failed host again only after a day (FR-021)', async () => {
    const { fetcher, fetchFn, clock, repository } = setup({})
    await fetcher.refresh(['f.com'])
    const calls = fetchFn.mock.calls.length
    const failedAt = Date.parse(repository.siteIcons()[0]!.checkedAt)
    clock.now = new Date(failedAt + 23 * 60 * 60 * 1000)
    await fetcher.refresh(['f.com'])
    expect(fetchFn.mock.calls.length).toBe(calls)
    clock.now = new Date(failedAt + 24 * 60 * 60 * 1000)
    await fetcher.refresh(['f.com'])
    expect(fetchFn.mock.calls.length).toBeGreaterThan(calls)
  })

  it('runs at most 4 hosts at a time and skips duplicates and empty hosts', async () => {
    let active = 0
    let peak = 0
    const { repository } = memoryRepository()
    const fetchFn = vi.fn<HttpFetch>(async () => {
      active++
      peak = Math.max(peak, active)
      await new Promise((resolve) => setTimeout(resolve, 5))
      active--
      return new Response(null, { status: 404 })
    })
    const fetcher = createIconFetcher({ fetchFn, store: repository, onChange: () => {} })
    const hosts = Array.from({ length: 10 }, (_, i) => `h${i}.com`)
    await fetcher.refresh([...hosts, 'h0.com', ''])
    expect(peak).toBeLessThanOrEqual(4)
    expect(repository.siteIcons()).toHaveLength(10)
  })

  it('reads from a test origin when one is set (NFR-003)', async () => {
    const { repository } = memoryRepository()
    const fetchFn = fakeWeb({
      'http://127.0.0.1:9000/djinni.co/': html('<link rel="icon" href="icon.png">'),
      'http://127.0.0.1:9000/djinni.co/icon.png': image(PNG),
    })
    const fetcher = createIconFetcher({
      fetchFn,
      store: repository,
      onChange: () => {},
      origin: 'http://127.0.0.1:9000',
    })
    await fetcher.refresh(['djinni.co'])
    expect(Object.keys(fetcher.icons())).toEqual(['djinni.co'])
  })
})
