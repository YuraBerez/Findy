import type { Language } from './types'

/** Spec 026 plan D-1: the one list of languages; the rest of the app reads it */
export const SUPPORTED_LANGUAGES = ['en', 'uk', 'pl'] as const satisfies readonly Language[]

export const isLanguage = (value: unknown): value is Language =>
  (SUPPORTED_LANGUAGES as readonly unknown[]).includes(value)
export const FALLBACK_LANGUAGE: Language = 'en'

/**
 * FR-041, spec 026 FR-002: the saved choice wins; otherwise the language of the OS locale
 * (`uk-UA` → Ukrainian, `pl_PL` → Polish), else English.
 */
export function resolveLanguage(saved: Language | null, systemLocale: string): Language {
  if (saved) return saved
  const system = systemLocale.toLowerCase().slice(0, 2)
  return isLanguage(system) ? system : FALLBACK_LANGUAGE
}
