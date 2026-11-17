import type { Language } from './types'

export const SUPPORTED_LANGUAGES: readonly Language[] = ['en', 'uk']
export const FALLBACK_LANGUAGE: Language = 'en'

/** FR-041: the saved choice wins; otherwise Ukrainian for a `uk*` OS locale, else English. */
export function resolveLanguage(saved: Language | null, systemLocale: string): Language {
  if (saved) return saved
  return systemLocale.toLowerCase().startsWith('uk') ? 'uk' : FALLBACK_LANGUAGE
}
