import { useTranslation } from 'react-i18next'
import logo from '../../../../assets/logo.svg'
import { SearchBox } from '../../features/search'
import { useSettingsMenu } from '../../features/settings'
import { useTransferMenu } from '../../features/transfer'
import { useUpdatesMenu } from '../../features/updates'
import type { Language, Theme } from '@shared/ipc'
import { Button, Menu, MoreIcon, Tabs } from '@ui'
import { VIEWS, VIEW_ID_PREFIX, type View } from '../views'
import styles from './Toolbar.module.css'

interface Props {
  storageReady: boolean
  onAdd(): void
  onThemeChange(theme: Theme): void
  onLanguageChange(language: Language): void
  /** Number of applications on the board (Reset is disabled at 0) */
  applicationCount: number
  onReset(): void
  onColumns(): void
  onAssistant(): void
  query: string
  onQueryChange(query: string): void
  /** Spec 010 FR-008: the dialog for N */
  onStaleAfter(): void
  /** Spec 013 FR-007 */
  onSupport(): void
  /** Spec 005 FR-001: the board or the analytics screen */
  view: View
  onViewChange(view: View): void
  /** Spec 006 FR-001, FR-002 */
  autoUpdateCheck: boolean
  onCheckUpdates(): void
  onAutoUpdateCheckChange(enabled: boolean): void
  /** Spec 008 FR-001, FR-010 */
  onExport(): void
  onImport(): void
}

export function Toolbar({
  storageReady,
  onAdd,
  onThemeChange,
  onLanguageChange,
  applicationCount,
  onReset,
  onColumns,
  onAssistant,
  query,
  onQueryChange,
  onStaleAfter,
  onSupport,
  view,
  onViewChange,
  autoUpdateCheck,
  onCheckUpdates,
  onAutoUpdateCheckChange,
  onExport,
  onImport,
}: Props) {
  const { t } = useTranslation()
  const settings = useSettingsMenu({ onLanguageChange, onThemeChange })
  const updates = useUpdatesMenu({
    autoCheck: autoUpdateCheck,
    onCheck: onCheckUpdates,
    onAutoCheckChange: onAutoUpdateCheckChange,
  })
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
            // Language and theme live in the menu, so the toolbar stays calm
            ...(storageReady ? settings : []),
            { key: 'settings-end', separator: true },
            {
              key: 'columns',
              label: t('columns.menuItem'),
              disabled: !storageReady,
              onSelect: onColumns,
            },
            {
              key: 'stale-after',
              label: t('stale.menuItem'),
              disabled: !storageReady,
              onSelect: onStaleAfter,
            },
            {
              key: 'assistant',
              label: t('mcp.menuItem'),
              disabled: !storageReady,
              onSelect: onAssistant,
            },
            { key: 'transfer-start', separator: true },
            ...transfer,
            { key: 'updates-start', separator: true },
            // A manual check works without the database; the switch needs it (FR-001)
            ...(storageReady ? updates : updates.slice(0, 1)),
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
