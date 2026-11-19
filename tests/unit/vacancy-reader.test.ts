import { describe, expect, it, vi } from 'vitest'
import { readVacancyPage, VACANCY_LIMITS, type VacancyFetch } from '../../src/main/vacancy'

const POSTING = `<script type="application/ld+json">${JSON.stringify({
  '@type': 'JobPosting',
  title: 'Frontend Developer',
  hiringOrganization: { name: 'Acme' },
})}</script>`

const html = (body = POSTING, headers: Record<string, string> = {}, status = 200) =>
  new Response(body, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', ...headers },
  })

const redirect = (location: string, status = 302) =>
  new Response(null, { status, headers: { location } })

/** A fake fetch that answers each URL in turn and records the calls */
function fakeFetch(...answers: (Response | Error)[]) {
  const fn = vi.fn<VacancyFetch>(async () => {
    const answer = answers.shift()
    if (!answer) throw new Error('no more answers')
    if (answer instanceof Error) throw answer
    return answer
  })
  return fn
}

const URL_ = 'https://jobs.example.com/vacancy/1'

describe('readVacancyPage (spec 009)', () => {
  it('reads the title and the company of the pasted page (FR-001, FR-004)', async () => {
    const fetch = fakeFetch(html())
    expect(await readVacancyPage(fetch, URL_)).toEqual({
      title: 'Frontend Developer',
      company: 'Acme',
    })
  })

  it('sends a plain GET: no cookies, manual redirects, a time limit (NFR-001)', async () => {
    const fetch = fakeFetch(html())
    await readVacancyPage(fetch, URL_)
    expect(fetch).toHaveBeenCalledOnce()
    const [url, init] = fetch.mock.calls[0]!
    expect(url).toBe(URL_)
    expect(init).toMatchObject({ method: 'GET', redirect: 'manual', credentials: 'omit' })
    expect(init.signal).toBeInstanceOf(AbortSignal)
    expect(init.body).toBeUndefined()
    expect(Object.keys(init.headers as object)).toEqual(['Accept'])
  })

  it('follows up to 5 redirects, relative ones too (NFR-001)', async () => {
    const fetch = fakeFetch(
      redirect('/a', 301),
      redirect('https://other.example.com/b', 302),
      redirect('c', 303),
      redirect('/d', 307),
      redirect('/e', 308),
      html(),
    )
    expect(await readVacancyPage(fetch, URL_)).not.toBeNull()
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      URL_,
      'https://jobs.example.com/a',
      'https://other.example.com/b',
      'https://other.example.com/c',
      'https://other.example.com/d',
      'https://other.example.com/e',
    ])
  })

  it('stops after 5 redirects', async () => {
    const fetch = fakeFetch(...Array.from({ length: 6 }, (_, i) => redirect(`/r${i}`)), html())
    expect(await readVacancyPage(fetch, URL_)).toBeNull()
    expect(fetch).toHaveBeenCalledTimes(6)
  })

  it.each(['file:///etc/passwd', 'javascript:alert(1)', 'ftp://example.com/x', 'http://[bad'])(
    'never follows a redirect to %s',
    async (location) => {
      const fetch = fakeFetch(redirect(location), html())
      expect(await readVacancyPage(fetch, URL_)).toBeNull()
      expect(fetch).toHaveBeenCalledOnce()
    },
  )

  it('never requests a link that is not http/https', async () => {
    const fetch = fakeFetch(html())
    expect(await readVacancyPage(fetch, 'file:///etc/passwd')).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  it.each([
    ['an error status', () => html(POSTING, {}, 404)],
    ['a redirect without Location', () => new Response(null, { status: 302 })],
    ['a PDF', () => html('%PDF-1.7', { 'content-type': 'application/pdf' })],
    ['no content type', () => new Response(POSTING)],
    ['a page without vacancy data', () => html('<p>Sign in</p>')],
  ])('returns null for %s (FR-006)', async (_case, answer) => {
    expect(await readVacancyPage(fakeFetch(answer()), URL_)).toBeNull()
  })

  it('accepts XHTML and decodes the charset of the header', async () => {
    const title = new Uint8Array([0xd0, 0xee, 0xe7, 0xf0, 0xee, 0xe1, 0xed, 0xe8, 0xea]) // windows-1251
    const body = new Uint8Array([
      ...new TextEncoder().encode('<title>'),
      ...title,
      ...new TextEncoder().encode('</title>'),
    ])
    const fetch = fakeFetch(
      new Response(body, {
        headers: { 'content-type': 'application/xhtml+xml; charset=windows-1251' },
      }),
    )
    expect(await readVacancyPage(fetch, URL_)).toEqual({ title: 'Розробник', company: null })
  })

  it('returns null when the network fails (FR-006)', async () => {
    expect(await readVacancyPage(fakeFetch(new TypeError('fetch failed')), URL_)).toBeNull()
  })

  it('stops a large page: by Content-Length, and while reading without it (NFR-002)', async () => {
    const limits = { ...VACANCY_LIMITS, maxBytes: 1000 }
    const declared = html(POSTING, { 'content-length': '5000' })
    expect(await readVacancyPage(fakeFetch(declared), URL_, limits)).toBeNull()

    let pulled = 0
    const endless = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled++
        controller.enqueue(new Uint8Array(400))
      },
    })
    const streamed = new Response(endless, { headers: { 'content-type': 'text/html' } })
    expect(await readVacancyPage(fakeFetch(streamed), URL_, limits)).toBeNull()
    expect(pulled).toBeLessThan(10) // stopped at the limit, not read to the end
  })

  it('reads an empty body as a page without data', async () => {
    expect(await readVacancyPage(fakeFetch(html('')), URL_)).toBeNull()
  })

  it('stops after the time limit (NFR-002)', async () => {
    const slow: VacancyFetch = (_url, init) =>
      new Promise((_resolve, reject) =>
        init.signal!.addEventListener('abort', () => reject(init.signal!.reason)),
      )
    const started = Date.now()
    expect(await readVacancyPage(slow, URL_, { ...VACANCY_LIMITS, timeoutMs: 50 })).toBeNull()
    expect(Date.now() - started).toBeLessThan(2000)
  })
})
