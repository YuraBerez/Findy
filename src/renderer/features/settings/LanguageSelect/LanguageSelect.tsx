import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES } from '@domain/language'
import type { Language } from '@shared/ipc'
import { Select } from '@ui'

// Each language is named in itself, so a user can find their own (FR-040)
const NAMES: Record<Language, string> = { en: 'English', uk: 'Українська' }

interface Props {
  disabled?: boolean
  onChange(language: Language): void
}

/** FR-042: switch the UI language at runtime. */
export function LanguageSelect({ disabled = false, onChange }: Props) {
  const { t, i18n } = useTranslation()
  return (
    <Select
      aria-label={t('language.label')}
      value={i18n.language}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as Language)}
    >
      {SUPPORTED_LANGUAGES.map((language) => (
        <option key={language} value={language} lang={language}>
          {NAMES[language]}
        </option>
      ))}
    </Select>
  )
}
