import { createElement } from 'react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES } from '@domain/language'
import type { Language, Theme } from '@shared/ipc'
import { MoonIcon, SunIcon, type MenuEntry } from '@ui'
import { isDarkNow, usePrefersDark } from './usePrefersDark'

// Each language is named in itself, so a user can find their own (FR-040)
const NAMES: Record<Language, string> = { en: 'English', uk: 'Українська' }

interface Options {
  onLanguageChange(language: Language): void
  onThemeChange(theme: Theme): void
}

/** App-menu entries: the language submenu (FR-042) and the sun/moon theme switch (FR-080…083). */
export function useSettingsMenu({ onLanguageChange, onThemeChange }: Options): MenuEntry[] {
  const { t, i18n } = useTranslation()
  // The theme that is shown: follows the OS until the user flips the switch
  const dark = usePrefersDark()
  const current = i18n.language as Language
  return [
    {
      key: 'language',
      submenu: true,
      label: t('language.label'),
      value: NAMES[current],
      backLabel: t('common.back'),
      options: SUPPORTED_LANGUAGES.map((language) => ({
        key: language,
        label: NAMES[language],
        lang: language,
        checked: current === language,
        onSelect: () => onLanguageChange(language),
      })),
    },
    {
      key: 'theme',
      toggle: true,
      label: t('theme.dark'),
      checked: dark,
      thumb: createElement(dark ? MoonIcon : SunIcon, { size: 11 }),
      // Read the live value: two fast clicks can come before React re-renders
      onToggle: () => onThemeChange(isDarkNow() ? 'light' : 'dark'),
    },
  ]
}
