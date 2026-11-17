import { useTranslation } from 'react-i18next'
import logo from '../../../../assets/logo.svg'
import { LanguageSelect, ThemeToggle } from '../../features/settings'
import type { Language, Theme } from '@shared/ipc'
import { Button, Menu, MoreIcon } from '@ui'
import styles from './Toolbar.module.css'

interface Props {
  storageReady: boolean
  onAdd(): void
  onThemeChange(theme: Theme): void
  onLanguageChange(language: Language): void
  /** Number of applications on the board (Reset is disabled at 0) */
  applicationCount: number
  onReset(): void
}

export function Toolbar({
  storageReady,
  onAdd,
  onThemeChange,
  onLanguageChange,
  applicationCount,
  onReset,
}: Props) {
  const { t } = useTranslation()
  return (
    <header className={styles.toolbar} aria-label={t('toolbar.label')}>
      <div className={styles.brand}>
        <img src={logo} alt="" width={28} height={28} />
        <span className={styles.name}>{t('app.name')}</span>
      </div>
      <div className={styles.actions}>
        <Button variant="primary" onClick={onAdd} disabled={!storageReady}>
          {t('toolbar.addApplication')}
        </Button>
        <LanguageSelect disabled={!storageReady} onChange={onLanguageChange} />
        <ThemeToggle disabled={!storageReady} onChange={onThemeChange} />
        <Menu
          triggerLabel={t('toolbar.menu')}
          triggerIcon={<MoreIcon size={18} />}
          label={t('toolbar.menu')}
          showLabel={false}
          items={[
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
