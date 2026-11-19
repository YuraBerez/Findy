import { isHttpUrl } from '../domain/limits'

/**
 * Node's `fetch`: no cookie store, and `redirect: 'manual'` gives each redirect to check
 * (spec 009 plan D-2). Injected, so tests use fakes.
 */
export type HttpFetch = (url: string, init: RequestInit) => Promise<Response>

export interface FetchLimits {
  timeoutMs: number
  maxBytes: number
  maxRedirects: number
  /** The `Accept` header */
  accept: string
  /** Content types to read (lower case, without parameters); omit to read any type */
  types?: readonly string[]
  /** Whether a redirect from `from` to `to` may be followed; `http`/`https` is always checked */
  allowRedirect?: (from: URL, to: URL) => boolean
}

export interface FetchedBody {
  bytes: Uint8Array
  contentType: string | null
  /** The address after redirects */
  url: string
}

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
 * One GET with no cookies and no body, for the outbound requests of constitution
 * §II.7 and §II.8: redirects followed one by one and checked, a type, size and time
 * limit. `null` for every failure: no network, an error status, a refused redirect,
 * a wrong type, too large, too slow.
 */
export async function fetchLimited(
  fetchFn: HttpFetch,
  url: string,
  limits: FetchLimits,
): Promise<FetchedBody | null> {
  const signal = AbortSignal.timeout(limits.timeoutMs) // the whole read, redirects included
  try {
    let current = url
    for (let redirects = 0; ; redirects++) {
      if (!isHttpUrl(current)) return null
      const response = await fetchFn(current, {
        method: 'GET',
        redirect: 'manual',
        credentials: 'omit',
        headers: { Accept: limits.accept },
        signal,
      })
      const location = response.headers.get('location')
      if (response.status >= 300 && response.status < 400 && location) {
        if (redirects >= limits.maxRedirects) return null
        const next = new URL(location, current)
        if (!isHttpUrl(next.href)) return null
        if (limits.allowRedirect && !limits.allowRedirect(new URL(current), next)) return null
        current = next.href
        continue
      }
      if (!response.ok) return null
      const contentType = response.headers.get('content-type')
      const type = contentType?.split(';')[0]?.trim().toLowerCase() ?? ''
      if (limits.types && !limits.types.includes(type)) return null
      const bytes = await readLimited(response, limits.maxBytes)
      return bytes && { bytes, contentType, url: current }
    }
  } catch {
    return null // no network, a timeout, a bad redirect address
  }
}
