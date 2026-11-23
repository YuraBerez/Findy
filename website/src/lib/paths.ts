/** Spec 020: the languages of the website. English is at the root (FR-021). */
export const LANGS = ['en', 'uk'] as const
export type Lang = (typeof LANGS)[number]
export const DEFAULT_LANG: Lang = 'en'

/** The name of each language in that language, for the language menu (FR-020) */
export const LANG_NAMES: Record<Lang, string> = { en: 'English', uk: 'Українська' }

/** A page of the website without the language: '' is the home page, else 'guide/install/' */
export type PageKey = string

export const isLang = (value: string): value is Lang => (LANGS as readonly string[]).includes(value)

export const otherLang = (lang: Lang): Lang => (lang === 'en' ? 'uk' : 'en')

/** The path of a page after the site base, for example 'uk/guide/install/' (FR-020) */
export function pagePath(lang: Lang, page: PageKey = ''): string {
  return lang === DEFAULT_LANG ? page : `${lang}/${page}`
}

/** The page key of a guide */
export const guidePage = (slug: string): PageKey => `guide/${slug}/`

/** The base of the site joined with a page path; the base ends with a slash */
export const withBase = (base: string, path: string): string =>
  `${base.endsWith('/') ? base : `${base}/`}${path}`
