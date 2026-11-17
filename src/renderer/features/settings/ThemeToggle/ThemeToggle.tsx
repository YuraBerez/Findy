import { useTranslation } from 'react-i18next'
import type { Theme } from '@shared/ipc'
import { MoonIcon, SunIcon, Switch } from '@ui'
import { isDarkNow, usePrefersDark } from '../usePrefersDark'

interface Props {
  disabled?: boolean
  onChange(theme: Theme): void
}

/** FR-080…082: sun/moon switch between the light and dark theme. */
export function ThemeToggle({ disabled = false, onChange }: Props) {
  const { t } = useTranslation()
  const dark = usePrefersDark()
  return (
    <Switch
      variant="neutral"
      checked={dark}
      label={t('theme.dark')}
      title={t(dark ? 'theme.switchToLight' : 'theme.switchToDark')}
      disabled={disabled}
      thumb={dark ? <MoonIcon size={14} /> : <SunIcon size={14} />}
      // Read the live value: two fast clicks can come before React re-renders
      onToggle={() => onChange(isDarkNow() ? 'light' : 'dark')}
    />
  )
}
