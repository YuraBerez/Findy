import { useTranslation } from 'react-i18next'
import type { Theme } from '../../shared/ipc'
import styles from './ThemeSwitcher.module.css'

const THEMES: readonly Theme[] = ['system', 'light', 'dark']

interface Props {
  value: Theme
  disabled?: boolean
  onChange(theme: Theme): void
}

/** FR-080…082: native radio inputs give keyboard support (arrows, Tab) for free. */
export function ThemeSwitcher({ value, disabled = false, onChange }: Props) {
  const { t } = useTranslation()
  return (
    <fieldset className={styles.switcher} disabled={disabled}>
      <legend className={styles.legend}>{t('theme.label')}</legend>
      {THEMES.map((theme) => (
        <label key={theme} className={styles.option}>
          <input
            type="radio"
            name="theme"
            value={theme}
            checked={value === theme}
            onChange={() => onChange(theme)}
          />
          <span>{t(`theme.${theme}`)}</span>
        </label>
      ))}
    </fieldset>
  )
}
