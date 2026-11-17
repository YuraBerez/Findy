import { initReactI18next } from 'react-i18next'
import type { Language } from '../domain/types'
import { createI18n } from '../shared/i18n'

export function createRendererI18n(language: Language) {
  return createI18n(language, [initReactI18next])
}
