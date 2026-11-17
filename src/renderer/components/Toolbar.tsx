import { useTranslation } from 'react-i18next'
import logo from '../../../assets/logo.svg'
import type { Language, Theme } from '../../shared/ipc'
import { LanguageSelect } from './LanguageSelect'
import { ThemeToggle } from './ThemeToggle'
import styles from './Toolbar.module.css'

interface Props {
  storageReady: boolean
  onAdd(): void
  onThemeChange(theme: Theme): void
  onLanguageChange(language: Language): void
}

export function Toolbar({ storageReady, onAdd, onThemeChange, onLanguageChange }: Props) {
  const { t } = useTranslation()
  return (
    <header className={styles.toolbar} aria-label={t('toolbar.label')}>
      <div className={styles.brand}>
        <img src={logo} alt="" width={28} height={28} />
        <span className={styles.name}>{t('app.name')}</span>
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className="button button--primary"
          onClick={onAdd}
          disabled={!storageReady}
        >
          {t('toolbar.addApplication')}
        </button>
        <LanguageSelect disabled={!storageReady} onChange={onLanguageChange} />
        <ThemeToggle disabled={!storageReady} onChange={onThemeChange} />
      </div>
    </header>
  )
}
