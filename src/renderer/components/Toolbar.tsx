import { useTranslation } from 'react-i18next'
import logo from '../../../assets/logo.svg'
import type { Theme } from '../../shared/ipc'
import { ThemeSwitcher } from './ThemeSwitcher'
import styles from './Toolbar.module.css'

interface Props {
  theme: Theme
  themeDisabled: boolean
  onThemeChange(theme: Theme): void
}

export function Toolbar({ theme, themeDisabled, onThemeChange }: Props) {
  const { t } = useTranslation()
  return (
    <header className={styles.toolbar} aria-label={t('toolbar.label')}>
      <div className={styles.brand}>
        <img src={logo} alt="" width={28} height={28} />
        <span className={styles.name}>{t('app.name')}</span>
      </div>
      <div className={styles.actions}>
        <ThemeSwitcher value={theme} disabled={themeDisabled} onChange={onThemeChange} />
      </div>
    </header>
  )
}
