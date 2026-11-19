import { declaredIcon, ICON_LIMITS, sniffImage } from '../domain/sites'
import { decodePage } from '../domain/vacancy'
import type { SiteIcon } from './db/repository'
import { fetchLimited, type HttpFetch } from './http'

/** Spec 011 FR-021, FR-022, NFR-001 */
export const ICON_FETCH = {
  timeoutMs: 5_000,
  maxRedirects: 5,
  /** The home page is read only for its declared icon */
  pageMaxBytes: 2 * 1024 * 1024,
  retryAfterMs: 24 * 60 * 60 * 1000,
  concurrency: 4,
}

export interface IconStore {
  siteIcons(): SiteIcon[]
  saveSiteIcon(host: string, mime: string, data: Uint8Array): void
  markSiteIconFailed(host: string): void
}

export interface IconFetcherDeps {
  fetchFn: HttpFetch
  store: IconStore
  now?: () => Date
  /** A saved icon changed: the renderer asks for the icons again */
  onChange(): void
  /** e2e only (plan, NFR-003): `<origin>/<host>/` stands in for `https://<host>/` */
  origin?: string
}

const withoutWww = (host: string) => host.toLowerCase().replace(/^www\./, '')

/**
 * Plan D-3: a request may go only to the same site — the same host, or one that differs
 * by `www.` or is a subdomain of the other (`linkedin.com` → `www.linkedin.com`,
 * `djinni.co` → `static.djinni.co`). Never to another site such as a CDN.
 */
export function sameSite(from: URL, to: URL): boolean {
  const a = withoutWww(from.hostname)
  const b = withoutWww(to.hostname)
  return a === b || b.endsWith(`.${a}`) || a.endsWith(`.${b}`)
}

const toDataUrl = (icon: SiteIcon) =>
  `data:${icon.mime};base64,${Buffer.from(icon.data!).toString('base64')}`

/**
 * Spec 011 FR-021: downloads each missing icon once, saves it by host, and tries a failed
 * host again at most once a day. At most `concurrency` hosts at a time.
 */
export function createIconFetcher({
  fetchFn,
  store,
  now = () => new Date(),
  onChange,
  origin,
}: IconFetcherDeps) {
  const running = new Set<string>()

  const due = (host: string) => {
    const icon = store.siteIcons().find((item) => item.host === host)
    if (!icon) return true
    if (icon.status === 'ok') return false
    return now().getTime() - Date.parse(icon.checkedAt) >= ICON_FETCH.retryAfterMs
  }

  /** FR-022: the icon the home page declares, else `/favicon.ico`; raster bytes only */
  const download = async (host: string): Promise<{ mime: string; data: Uint8Array } | null> => {
    const home = origin ? `${origin}/${host}/` : `https://${host}/`
    const allowRedirect = sameSite
    const page = await fetchLimited(fetchFn, home, {
      timeoutMs: ICON_FETCH.timeoutMs,
      maxRedirects: ICON_FETCH.maxRedirects,
      maxBytes: ICON_FETCH.pageMaxBytes,
      accept: 'text/html',
      types: ['text/html', 'application/xhtml+xml'],
      allowRedirect,
    })
    const pageUrl = page?.url ?? home
    const declared = page ? declaredIcon(decodePage(page.bytes, page.contentType), pageUrl) : null
    const candidates = [declared, new URL(origin ? 'favicon.ico' : '/favicon.ico', pageUrl).href]
    for (const candidate of candidates) {
      if (!candidate || !sameSite(new URL(home), new URL(candidate))) continue
      const body = await fetchLimited(fetchFn, candidate, {
        timeoutMs: ICON_FETCH.timeoutMs,
        maxRedirects: ICON_FETCH.maxRedirects,
        maxBytes: ICON_LIMITS.maxBytes,
        accept: 'image/*',
        allowRedirect,
      })
      const mime = body && sniffImage(body.bytes)
      if (body && mime) return { mime, data: body.bytes }
    }
    return null
  }

  const fetchOne = async (host: string) => {
    running.add(host)
    try {
      const icon = await download(host)
      if (icon) {
        store.saveSiteIcon(host, icon.mime, icon.data)
        onChange()
      } else store.markSiteIconFailed(host)
    } finally {
      running.delete(host)
    }
  }

  return {
    /** Host → `data:` URL of each saved icon (plan D-2) */
    icons(): Record<string, string> {
      return Object.fromEntries(
        store
          .siteIcons()
          .filter((icon) => icon.status === 'ok' && icon.mime && icon.data)
          .map((icon) => [icon.host, toDataUrl(icon)]),
      )
    },

    /** FR-021, FR-023: downloads the due icons in the background; resolves when done */
    async refresh(hosts: readonly string[]): Promise<void> {
      const queue = [...new Set(hosts.filter(Boolean))].filter(
        (host) => !running.has(host) && due(host),
      )
      const worker = async () => {
        for (let host = queue.shift(); host; host = queue.shift()) await fetchOne(host)
      }
      await Promise.all(Array.from({ length: ICON_FETCH.concurrency }, worker))
    },
  }
}

export type IconFetcher = ReturnType<typeof createIconFetcher>
