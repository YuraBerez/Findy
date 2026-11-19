import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'

const ldJson = (title: string, company: string) =>
  `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title,
    hiringOrganization: { '@type': 'Organization', name: company },
  })}</script>`

const html = (head: string, body = '') =>
  `<!doctype html><html><head><meta charset="utf-8">${head}</head><body>${body}</body></html>`

/** Test pages of spec 009 (NFR-004: tests never reach real sites) */
const PAGES: Record<string, { type: string; body: string; cookie?: string }> = {
  /** Job posting data; sets a cookie that a later read must not send back (NFR-001) */
  '/jobs/frontend': {
    type: 'text/html; charset=utf-8',
    body: html('<title>Jobs</title>' + ldJson('Frontend Developer', 'Acme')),
    cookie: 'session=secret; Path=/',
  },
  /** Link preview data only, with the site name in the title (FR-004 step 2) */
  '/jobs/preview': {
    type: 'text/html',
    body: html(
      '<meta property="og:title" content="Senior QA — Globex | Jobs Board">' +
        '<meta property="og:site_name" content="Jobs Board">',
    ),
  },
  /** A page that needs a login: no vacancy data (US-2.1) */
  '/jobs/sign-in': { type: 'text/html', body: html('', '<p>Sign in to see this vacancy.</p>') },
  '/files/vacancy.pdf': { type: 'application/pdf', body: '%PDF-1.7' },
  /** Answered only after `release()` (US-1.4, FR-007, US-2.3) */
  '/jobs/held': { type: 'text/html', body: html(ldJson('Held Role', 'Initech')) },
}

export interface VacancyRequest {
  path: string
  cookie: string | undefined
}

/** A local site with vacancy pages; `/go` redirects to `/jobs/frontend`. */
export class VacancyServer {
  readonly requests: VacancyRequest[] = []
  private held: (() => void)[] = []

  private constructor(
    private readonly server: Server,
    private readonly origin: string,
  ) {}

  static async start(): Promise<VacancyServer> {
    const box: { self?: VacancyServer } = {}
    const server = createServer((request, response) => void box.self!.answer(request, response))
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const { port } = server.address() as AddressInfo
    box.self = new VacancyServer(server, `http://127.0.0.1:${port}`)
    return box.self
  }

  url(path: string): string {
    return this.origin + path
  }

  /** Answers the requests to `/jobs/held` that wait */
  release(): void {
    for (const answer of this.held.splice(0)) answer()
  }

  private async answer(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const path = request.url ?? '/'
    this.requests.push({ path, cookie: request.headers.cookie })
    if (path === '/go') {
      response.writeHead(302, { Location: '/jobs/frontend' }).end()
      return
    }
    const page = PAGES[path]
    if (!page) {
      response.writeHead(404).end()
      return
    }
    if (path === '/jobs/held') await new Promise<void>((resolve) => this.held.push(resolve))
    const headers: Record<string, string> = { 'Content-Type': page.type }
    if (page.cookie) headers['Set-Cookie'] = page.cookie
    response.writeHead(200, headers).end(page.body)
  }

  async close(): Promise<void> {
    this.release()
    this.server.closeAllConnections()
    await new Promise<void>((resolve) => this.server.close(() => resolve()))
  }
}
