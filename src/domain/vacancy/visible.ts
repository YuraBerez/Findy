// FR-004 step 3: the main heading and an element marked as the company.
import { LIMITS } from '../limits'
import { attributesOf, clean, elementContent, visibleHtml } from './text'
import type { VacancyData } from './extract'

/** Class, id or data names that mark the hiring company, in English and Ukrainian */
const COMPANY_HINT = /company|employer|organi[sz]ation|компан|роботодав/i
const HINT_ATTRIBUTES = ['class', 'id', 'itemprop', 'data-testid', 'data-qa']

/** A company name is short; a longer text is a paragraph about the company */
const MAX_COMPANY_CHARS = 100

function markedCompany(page: string): string | null {
  for (const match of page.matchAll(/<[a-z][\w-]*\b[^>]*>/gi)) {
    const attributes = attributesOf(match[0])
    if (!HINT_ATTRIBUTES.some((name) => COMPANY_HINT.test(attributes.get(name) ?? ''))) continue
    const text = clean(elementContent(page, match.index), MAX_COMPANY_CHARS + 1)
    if (text && Array.from(text).length <= MAX_COMPANY_CHARS) return clean(text, LIMITS.company)
  }
  return null
}

export function visibleVacancy(html: string): VacancyData {
  const page = visibleHtml(html)
  const heading = /<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/i.exec(page)?.[1]
  return { title: clean(heading, LIMITS.title), company: markedCompany(page) }
}
