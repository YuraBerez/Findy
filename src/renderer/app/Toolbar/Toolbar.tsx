import { useTranslation } from 'react-i18next'
import logo from '../../../../assets/logo.svg'
import { SearchBox } from '../../features/search'
import { useTransferMenu } from '../../features/transfer'
import { useUpdatesMenu } from '../../features/updates'
import { Button, Menu, MoreIcon, Tabs } from '@ui'
import { VIEWS, VIEW_ID_PREFIX, type View } from '../views'
import styles from './Toolbar.module.css'

interface Props {
  storageReady: boolean
  onAdd(): void
  /** Number of applications on the board (Reset is disabled at 0) */
  applicationCount: number
  onReset(): void
  /** Spec 018 FR-002 */
  onSettings(): void
  query: string
  onQueryChange(query: string): void
  /** Spec 013 FR-007 */
  onSupport(): void
  /** Spec 005 FR-001: the board or the analytics screen */
  view: View
  onViewChange(view: View): void
  /** Spec 006 FR-001 */
  onCheckUpdates(): void
  /** Spec 008 FR-001, FR-010 */
  onExport(): void
  onImport(): void
}

export function Toolbar({
  storageReady,
  onAdd,
  applicationCount,
  onReset,
  onSettings,
  query,
  onQueryChange,
  onSupport,
  view,
  onViewChange,
  onCheckUpdates,
  onExport,
  onImport,
}: Props) {
  const { t } = useTranslation()
  const checkUpdates = useUpdatesMenu(onCheckUpdates)
  const transfer = useTransferMenu({
    enabled: storageReady,
    canExport: applicationCount > 0,
    onExport,
    onImport,
  })
  return (
    <header className={styles.toolbar} aria-label={t('toolbar.label')}>
      <div className={styles.brand}>
        <img src={logo} alt="" width={28} height={28} />
        <span className={styles.name}>{t('app.name')}</span>
      </div>
      {storageReady && (
        <Tabs
          label={t('views.label')}
          items={VIEWS.map((key) => ({ key, label: t(`views.${key}`) }))}
          value={view}
          onChange={onViewChange}
          idPrefix={VIEW_ID_PREFIX}
        />
      )}
      <div className={styles.actions}>
        {/* Spec 005 FR-004: board actions only on the board */}
        {view === 'board' && (
          <>
            <SearchBox value={query} onChange={onQueryChange} />
            <Button variant="primary" onClick={onAdd} disabled={!storageReady}>
              {t('toolbar.addApplication')}
            </Button>
          </>
        )}
        <Menu
          triggerLabel={t('toolbar.menu')}
          triggerIcon={<MoreIcon size={18} />}
          label={t('toolbar.menu')}
          items={[
            // Spec 018 FR-020: only actions; the settings are in their own window
            {
              key: 'settings',
              label: t('settings.menuItem'),
              disabled: !storageReady,
              onSelect: onSettings,
            },
            { key: 'transfer-start', separator: true },
            ...transfer,
            { key: 'updates-start', separator: true },
            checkUpdates,
            { key: 'support', label: t('support.menuItem'), onSelect: onSupport },
            { key: 'updates-end', separator: true },
            {
              key: 'reset',
              label: t('reset.menuItem'),
              danger: true,
              // FR-090: nothing to reset on an empty board
              disabled: !storageReady || applicationCount === 0,
              onSelect: onReset,
            },
          ]}
        />
      </div>
    </header>
  )
}
