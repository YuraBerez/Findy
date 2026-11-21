import { useTranslation } from 'react-i18next'
import type { MenuEntry } from '@ui'

/** Spec 006 FR-001: the manual check in the app menu; the switch is in Settings (spec 018) */
export function useUpdatesMenu(onCheck: () => void): MenuEntry {
  const { t } = useTranslation()
  return { key: 'check-updates', label: t('updates.menuCheck'), onSelect: onCheck }
}
