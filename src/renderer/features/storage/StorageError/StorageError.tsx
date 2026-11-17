import { useTranslation } from 'react-i18next'
import type { StorageStatus } from '@shared/ipc'
import styles from './StorageError.module.css'

type ErrorStatus = Extract<StorageStatus, { status: 'error' }>

/** FR-054: explain what happened and where the file is. */
export function StorageError({ storage }: { storage: ErrorStatus }) {
  const { t } = useTranslation()
  return (
    <section className={styles.banner} role="alert" data-testid="storage-error">
      <h2 className={styles.title}>{t('storage.errorTitle')}</h2>
      <p>{t(`storage.${storage.error}`, { backupPath: storage.backupPath ?? '' })}</p>
      <p className={styles.path}>{t('storage.location', { dataFilePath: storage.dataFilePath })}</p>
    </section>
  )
}
