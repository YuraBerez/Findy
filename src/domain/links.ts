// Spec 019 FR-007: two vacancy links that point to the same vacancy.

/** Query parameters that only track where a click came from */
const TRACKING_PARAMETER =
  /^(utm_.+|ref|refid|referrer|trk|trkinfo|tracking|source|src|fbclid|gclid|msclkid|mc_cid|mc_eid|_hsenc|_hsmi)$/i

/**
 * The key of a vacancy link for the duplicate check: the host in lower case, no slash at
 * the end of the path, no `#…`, no tracking parameters; other parameters sorted, because
 * some sites keep the vacancy id in the query. `null` for a link that is not http(s).
 */
export function vacancyLinkKey(url: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    return null
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
  const parameters = [...parsed.searchParams]
    .filter(([name]) => !TRACKING_PARAMETER.test(name))
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  const query = new URLSearchParams(parameters).toString()
  const path = parsed.pathname.replace(/\/+$/, '')
  return `${parsed.host.toLowerCase()}${path}${query ? `?${query}` : ''}`
}

/** FR-007: true when both links are http(s) and point to the same vacancy */
export function sameVacancyLink(a: string, b: string): boolean {
  const key = vacancyLinkKey(a)
  return key !== null && key === vacancyLinkKey(b)
}
