import { useTranslation } from 'react-i18next'
import logo from '../../../../assets/logo.svg'
import { SearchBox } from '../../features/search'
import { useSettingsMenu } from '../../features/settings'
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
  /** Spec 005 FR-001: the board or the analytics screen */
  view: View
  onViewChange(view: View): void
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
  view,
  onViewChange,
}: Props) {
  const { t } = useTranslation()
  const settings = useSettingsMenu({ onLanguageChange, onThemeChange })
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
              key: 'assistant',
              label: t('mcp.menuItem'),
              disabled: !storageReady,
              onSelect: onAssistant,
            },
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
