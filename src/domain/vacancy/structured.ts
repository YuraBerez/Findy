// FR-004 step 1: schema.org JobPosting, as JSON-LD or as microdata.
import { LIMITS } from '../limits'
import { attributesOf, clean, elementContent, visibleHtml } from './text'
import type { VacancyData } from './extract'

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

function jsonLd(html: string): VacancyData {
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

/** Value of the first `itemprop="name"` element: its `content` attribute or its text */
function itemValue(html: string, property: string, from = 0): { value: string | null; at: number } {
  const pattern = new RegExp(
    `<[a-z][\\w-]*\\b[^>]*\\bitemprop\\s*=\\s*["']?${property}\\b[^>]*>`,
    'gi',
  )
  pattern.lastIndex = from
  const match = pattern.exec(html)
  if (!match) return { value: null, at: -1 }
  const content = attributesOf(match[0]).get('content')
  return { value: content ?? elementContent(html, match.index), at: match.index }
}

function microdata(html: string): VacancyData {
  if (!/\bitemtype\s*=\s*["']?https?:\/\/schema\.org\/JobPosting\b/i.test(html))
    return { title: null, company: null }
  const page = visibleHtml(html)
  const organisation = itemValue(page, 'hiringOrganization')
  // The organisation's name is the first `name` inside it (or its own text)
  const name = organisation.at < 0 ? null : itemValue(page, 'name', organisation.at).value
  return {
    title: clean(itemValue(page, 'title').value, LIMITS.title),
    company: clean(name ?? organisation.value, LIMITS.company),
  }
}

/** Job posting data for search engines: JSON-LD first, then microdata, field by field */
export function structuredVacancy(html: string): VacancyData {
  const ld = jsonLd(html)
  if (ld.title && ld.company) return ld
  const micro = microdata(html)
  return { title: ld.title ?? micro.title, company: ld.company ?? micro.company }
}
