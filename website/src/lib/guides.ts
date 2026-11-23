import { DEFAULT_LANG, isLang, type Lang } from './paths'

/** Spec 020 FR-006: the guides in docs/guide, in the order of the navigation */
export const GUIDES = ['install', 'browser-extension', 'ai-assistant'] as const
export type GuideSlug = (typeof GUIDES)[number]

export const isGuide = (slug: string): slug is GuideSlug =>
  (GUIDES as readonly string[]).includes(slug)

/**
 * The slug and the language of a guide file name without `.md`: `install` is English,
 * `install.uk` is Ukrainian. Null for a name that is not a guide.
 */
export function parseGuideId(id: string): { slug: GuideSlug; lang: Lang } | null {
  const [slug = '', lang = DEFAULT_LANG, ...rest] = id.split('.')
  if (rest.length > 0 || !isGuide(slug) || !isLang(lang)) return null
  return { slug, lang }
}

/** Edge case: every guide in every language, else the build fails */
export function missingGuides(ids: string[], langs: readonly Lang[]): string[] {
  const have = new Set(ids.map(parseGuideId).map((g) => g && `${g.slug}.${g.lang}`))
  return GUIDES.flatMap((slug) => langs.map((lang) => `${slug}.${lang}`)).filter(
    (key) => !have.has(key),
  )
}
