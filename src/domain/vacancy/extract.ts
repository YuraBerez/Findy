// Spec 009 FR-004: job title and company of a vacancy page, from the most reliable
// source that has each one. The HTML is only searched as text (plan D-3).
import { LIMITS } from '../limits'
import { structuredVacancy } from './structured'
import { attributesOf, clean } from './text'
import { splitTitle } from './title'
import { visibleVacancy } from './visible'

export interface VacancyData {
  title: string | null
  company: string | null
}

/** `<meta property|name="…" content="…">` values by key; the first one of a key wins. */
function metaTags(html: string): Map<string, string> {
  const tags = new Map<string, string>()
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = attributesOf(tag)
    const name = (attributes.get('property') ?? attributes.get('name'))?.toLowerCase()
    const content = attributes.get('content')
    if (name && content !== undefined && !tags.has(name)) tags.set(name, content)
  }
  return tags
}

/**
 * FR-004, each field on its own: 1. job posting data; 2. the link preview title (else
 * the page title) split into job title and company; 3. the main heading and an element
 * marked as the company; 4. the link preview site name as the company.
 * `url` is the page address: its host is a site name to drop from the title.
 */
export function extractVacancy(html: string, url?: string): VacancyData {
  const meta = metaTags(html)
  const siteName = clean(meta.get('og:site_name'), LIMITS.company)
  const pageTitle = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]
  const sources = [
    structuredVacancy(html),
    splitTitle(meta.get('og:title')?.trim() ? meta.get('og:title') : pageTitle, siteName, url),
    visibleVacancy(html),
    { title: null, company: siteName },
  ]
  return {
    title: sources.find((source) => source.title)?.title ?? null,
    company: sources.find((source) => source.company)?.company ?? null,
  }
}
