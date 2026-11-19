import { decodePage, extractVacancy, type VacancyData } from '../domain/vacancy'
import { fetchLimited, type HttpFetch } from './http'

/** Spec 009 NFR-001, NFR-002 */
export const VACANCY_LIMITS = {
  timeoutMs: 10_000,
  maxBytes: 2 * 1024 * 1024,
  maxRedirects: 5,
}

const HTML_TYPES = ['text/html', 'application/xhtml+xml']

export type VacancyFetch = HttpFetch

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
  const page = await fetchLimited(fetchFn, url, {
    ...limits,
    accept: 'text/html,application/xhtml+xml',
    types: HTML_TYPES,
  })
  if (!page) return null
  const data = extractVacancy(decodePage(page.bytes, page.contentType), page.url)
  return data.title || data.company ? data : null
}
