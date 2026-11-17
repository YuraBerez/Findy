import type { Language } from '../domain/types'
import { createI18n } from '../shared/i18n'

export type Translate = (key: string, options?: Record<string, unknown>) => string

/** Translator for main-process text: native menu and dialogs (FR-044). */
export function createMainTranslator(language: Language): Translate {
  const instance = createI18n(language)
  return (key, options) => instance.t(key, options ?? {})
}
