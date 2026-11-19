// FR-004 step 2: "Job title — Company | Site" → job title and company.
import { LIMITS } from '../limits'
import { clean } from './text'
import type { VacancyData } from './extract'

/** Separators between the parts of a page title; spaces around them are required */
const SEPARATOR = /\s+(?:[|—–·-]|::)\s+/

/** Lower case, letters and digits only: "Work.ua" and "work ua" match */
const key = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')

/** Names of the site: its link preview name and its host without `www.` and the TLD */
function siteKeys(siteName: string | null, url: string | undefined): Set<string> {
  const keys = new Set<string>()
  if (siteName) keys.add(key(siteName))
  if (url) {
    try {
      const host = new URL(url).hostname.replace(/^www\./, '')
      keys.add(key(host)) // "work.ua" → "workua"
      keys.add(key(host.split('.')[0]!)) // "djinni.co" → "djinni"
    } catch {
      // no host to compare with
    }
  }
  keys.delete('')
  return keys
}

/**
 * Splits a page title into the job title and the company. Parts that are the site's
 * own name are dropped; the first part left is the job title, the second the company.
 * One part left: "Job title at Company" is split too, else it is the job title only.
 */
export function splitTitle(
  raw: string | undefined,
  siteName: string | null,
  url: string | undefined,
): VacancyData {
  const text = clean(raw, Number.MAX_SAFE_INTEGER)
  if (!text) return { title: null, company: null }
  const site = siteKeys(siteName, url)
  const parts = text.split(SEPARATOR).filter((part) => part && !site.has(key(part)))
  if (parts.length === 0) return { title: null, company: null }
  if (parts.length === 1) {
    const at = /^(.+?)\s+at\s+(.+)$/i.exec(parts[0]!)
    return at
      ? { title: clean(at[1], LIMITS.title), company: clean(at[2], LIMITS.company) }
      : { title: clean(parts[0], LIMITS.title), company: null }
  }
  return { title: clean(parts[0], LIMITS.title), company: clean(parts[1], LIMITS.company) }
}
