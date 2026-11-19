// Spec 011 FR-006: the address a tile opens for the search query.
import type { KnownSite, QueryEncoding } from './known'

/** The place of the query in a site address (FR-010) */
export const QUERY_PLACEHOLDER = '{query}'

/** A site the user added (FR-010) */
export interface CustomSite {
  id: string
  name: string
  /** `http`/`https`; may hold `{query}` once, not in the host */
  url: string
}

function encode(query: string, encoding: QueryEncoding): string {
  if (encoding === 'plus') return encodeURIComponent(query).replace(/%20/g, '+')
  if (encoding === 'slug')
    return encodeURIComponent(
      query
        .toLocaleLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, ''),
    )
  return encodeURIComponent(query)
}

/** FR-006: the known site's search for a non-empty query, else its jobs page. */
export function knownSiteUrl(site: KnownSite, query: string): string {
  const text = query.trim()
  if (!text || !site.search) return site.jobsUrl
  const value = encode(text, site.search.encoding)
  // A query of only signs gives an empty slug: the jobs page is better than a broken path
  return value ? site.search.template.replace(QUERY_PLACEHOLDER, value) : site.jobsUrl
}

/** FR-006: the user's address with the query in place of `{query}` (empty for no query). */
export function customSiteUrl(site: CustomSite, query: string): string {
  return site.url.replace(QUERY_PLACEHOLDER, encode(query.trim(), 'component'))
}

/** FR-004: the host shown on a tile and the key of its icon, without `www.` */
export function siteHost(address: string): string {
  try {
    return new URL(address.replace(QUERY_PLACEHOLDER, '')).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}
