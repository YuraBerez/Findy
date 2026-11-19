// Spec 009 FR-004: job title and company from the data a vacancy page publishes for
// search engines and link previews. The HTML is only searched as text (plan D-3).
import { LIMITS } from '../limits'

export interface VacancyData {
  title: string | null
  company: string | null
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  laquo: '«',
  raquo: '»',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  middot: '·',
  bull: '•',
}

function decodeEntities(text: string): string {
  return text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, body: string) => {
    if (body[0] === '#') {
      const code =
        body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : Number(body.slice(1))
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? entity
  })
}

/** Entities decoded, tags removed, whitespace collapsed, cut to the field limit; `null` when empty. */
function clean(value: unknown, limit: number): string | null {
  if (typeof value !== 'string') return null
  const text = decodeEntities(value.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return null
  const chars = Array.from(text) // never cut a character in half
  return chars.length > limit ? chars.slice(0, limit).join('').trimEnd() : text
}

type Json = null | boolean | number | string | Json[] | { [key: string]: Json }

function isJobPosting(node: { [key: string]: Json }): boolean {
  const type = node['@type']
  return Array.isArray(type) ? type.includes('JobPosting') : type === 'JobPosting'
}

/** The first `JobPosting` in a JSON-LD value: top level, in arrays or in `@graph`. */
function findJobPosting(value: Json): { [key: string]: Json } | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findJobPosting(item)
      if (found) return found
    }
    return null
  }
  if (value === null || typeof value !== 'object') return null
  if (isJobPosting(value)) return value
  return value['@graph'] === undefined ? null : findJobPosting(value['@graph'])
}

function organisationName(value: Json | undefined): Json | undefined {
  if (Array.isArray(value)) return organisationName(value[0])
  if (value !== null && typeof value === 'object') return value.name
  return value
}

function jobPosting(html: string): VacancyData {
  const scripts = html.matchAll(
    /<script\b[^>]*\btype\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi,
  )
  for (const [, body] of scripts) {
    let json: Json
    try {
      json = JSON.parse(body!) as Json
    } catch {
      continue // a broken block on the page: try the next one
    }
    const posting = findJobPosting(json)
    if (posting)
      return {
        title: clean(posting.title ?? posting.name, LIMITS.title),
        company: clean(organisationName(posting.hiringOrganization), LIMITS.company),
      }
  }
  return { title: null, company: null }
}

/** `<meta property|name="…" content="…">` values by key; the first one of a key wins. */
function metaTags(html: string): Map<string, string> {
  const tags = new Map<string, string>()
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = new Map<string, string>()
    for (const [, name, , double, single, bare] of tag.matchAll(
      /([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g,
    ))
      attributes.set(name!.toLowerCase(), double ?? single ?? bare ?? '')
    const key = (attributes.get('property') ?? attributes.get('name'))?.toLowerCase()
    const content = attributes.get('content')
    if (key && content !== undefined && !tags.has(key)) tags.set(key, content)
  }
  return tags
}

/**
 * FR-004: job posting data first, then link preview data (`og:title`, `og:site_name`),
 * then the page title. Each field falls back on its own.
 */
export function extractVacancy(html: string): VacancyData {
  const posting = jobPosting(html)
  const meta = metaTags(html)
  const pageTitle = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]
  return {
    title:
      posting.title ?? clean(meta.get('og:title'), LIMITS.title) ?? clean(pageTitle, LIMITS.title),
    company: posting.company ?? clean(meta.get('og:site_name'), LIMITS.company),
  }
}
