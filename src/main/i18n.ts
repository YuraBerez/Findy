import type { Language } from '../domain/types'
import { createI18n } from '../shared/i18n'

/** Translator for main-process text: native menu and dialogs (FR-044). */
export function createMainTranslator(language: Language) {
  return createI18n(language).t
}
