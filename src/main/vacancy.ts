import { isHttpUrl } from '../domain/limits'
import { decodePage, extractVacancy, type VacancyData } from '../domain/vacancy'

/** Spec 009 NFR-001, NFR-002 */
export const VACANCY_LIMITS = {
  timeoutMs: 10_000,
  maxBytes: 2 * 1024 * 1024,
  maxRedirects: 5,
}

const HTML_TYPES = ['text/html', 'application/xhtml+xml']

/** A `fetch` of a session with no cookies (plan D-2); injected, so tests use fakes */
export type VacancyFetch = (url: string, init: RequestInit) => Promise<Response>

/** The body up to `maxBytes`; `null` when it is larger (the read stops there). */
async function readLimited(response: Response, maxBytes: number): Promise<Uint8Array | null> {
  if (Number(response.headers.get('content-length')) > maxBytes) return null
  if (!response.body) return new Uint8Array()
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > maxBytes) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes
}

/**
 * Spec 009: reads the page of a pasted vacancy link and returns its job title and
 * company. One GET (plus redirects, each one checked), no cookies, no user data.
 * `null` for every failure and for a page with neither value (FR-006): the dialog
 * shows a short message, not an error.
 */
export async function readVacancyPage(
  fetchFn: VacancyFetch,
  url: string,
  limits = VACANCY_LIMITS,
): Promise<VacancyData | null> {
  const signal = AbortSignal.timeout(limits.timeoutMs) // the whole read, redirects included
  try {
    let current = url
    for (let redirects = 0; ; redirects++) {
      if (!isHttpUrl(current)) return null
      const response = await fetchFn(current, {
        method: 'GET',
        redirect: 'manual',
        credentials: 'omit',
        headers: { Accept: 'text/html,application/xhtml+xml' },
        signal,
      })
      const location = response.headers.get('location')
      if (response.status >= 300 && response.status < 400 && location) {
        if (redirects >= limits.maxRedirects) return null
        current = new URL(location, current).href
        continue
      }
      if (!response.ok) return null
      const contentType = response.headers.get('content-type')
      const type = contentType?.split(';')[0]?.trim().toLowerCase() ?? ''
      if (!HTML_TYPES.includes(type)) return null
      const bytes = await readLimited(response, limits.maxBytes)
      if (!bytes) return null
      const data = extractVacancy(decodePage(bytes, contentType), current)
      return data.title || data.company ? data : null
    }
  } catch {
    return null // no network, a timeout, a bad redirect address
  }
}
