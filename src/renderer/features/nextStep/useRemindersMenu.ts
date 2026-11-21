import { useTranslation } from 'react-i18next'
import type { MenuEntry } from '@ui'

/** Spec 015 FR-030: the "Reminders" toggle in the app menu */
export function useRemindersMenu(
  enabled: boolean,
  onChange: (enabled: boolean) => void,
): MenuEntry {
  const { t } = useTranslation()
  return {
    key: 'reminders',
    toggle: true,
    label: t('reminders.menuItem'),
    checked: enabled,
    onToggle: () => onChange(!enabled),
  }
}
