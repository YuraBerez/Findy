import { useTranslation } from 'react-i18next'
import type { Theme } from '../../shared/ipc'
import { usePrefersDark } from '../hooks/usePrefersDark'
import styles from './ThemeToggle.module.css'

interface Props {
  disabled?: boolean
  onChange(theme: Theme): void
}

/** FR-080…082: sun/moon switch between the light and dark theme. */
export function ThemeToggle({ disabled = false, onChange }: Props) {
  const { t } = useTranslation()
  const dark = usePrefersDark()

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={t('theme.dark')}
      title={t(dark ? 'theme.switchToLight' : 'theme.switchToDark')}
      className={styles.toggle}
      disabled={disabled}
      onClick={() => onChange(dark ? 'light' : 'dark')}
    >
      <span className={styles.knob} aria-hidden="true">
        {dark ? <MoonIcon /> : <SunIcon />}
      </span>
    </button>
  )
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="4.5" fill="currentColor" stroke="none" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
      <path d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5a8.5 8.5 0 1 0 11.1 11.1Z" />
    </svg>
  )
}
