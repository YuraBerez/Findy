// One i18next setup shared by main (menu, dialogs) and renderer (docs/i18n.md)
import i18next, { type i18n } from 'i18next'
import en from '../../locales/en.json'
import uk from '../../locales/uk.json'
import { FALLBACK_LANGUAGE } from '../domain/language'
import type { Language } from '../domain/types'

export const resources = {
  en: { translation: en },
  uk: { translation: uk },
} as const

export function createI18n(language: Language, plugins: Parameters<i18n['use']>[0][] = []): i18n {
  const instance = i18next.createInstance()
  for (const plugin of plugins) instance.use(plugin)
  void instance.init({
    lng: language,
    fallbackLng: FALLBACK_LANGUAGE,
    resources,
    initAsync: false,
    interpolation: { escapeValue: false }, // React escapes; main uses plain text
    returnNull: false,
  })
  return instance
}
