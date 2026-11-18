import { useTranslation } from 'react-i18next'
import type { MenuEntry } from '@ui'

interface Options {
  enabled: boolean
  /** FR-001: nothing to export on an empty board */
  canExport: boolean
  onExport(): void
  onImport(): void
}

/** Spec 008 FR-001, FR-010: app-menu entries for CSV export and import. */
export function useTransferMenu({ enabled, canExport, onExport, onImport }: Options): MenuEntry[] {
  const { t } = useTranslation()
  return [
    {
      key: 'export-csv',
      label: t('transfer.menuExport'),
      disabled: !enabled || !canExport,
      onSelect: onExport,
    },
    { key: 'import-csv', label: t('transfer.menuImport'), disabled: !enabled, onSelect: onImport },
  ]
}
