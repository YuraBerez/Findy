import { useTranslation } from 'react-i18next'
import type { MenuEntry } from '@ui'

interface Options {
  autoCheck: boolean
  onCheck(): void
  onAutoCheckChange(enabled: boolean): void
}

/** Spec 006 FR-001, FR-002: app-menu entries for the update check. */
export function useUpdatesMenu({ autoCheck, onCheck, onAutoCheckChange }: Options): MenuEntry[] {
  const { t } = useTranslation()
  return [
    { key: 'check-updates', label: t('updates.menuCheck'), onSelect: onCheck },
    {
      key: 'auto-updates',
      toggle: true,
      label: t('updates.menuAuto'),
      checked: autoCheck,
      onToggle: () => onAutoCheckChange(!autoCheck),
    },
  ]
}
