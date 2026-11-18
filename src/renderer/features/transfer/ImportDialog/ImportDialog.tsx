import { useTranslation } from 'react-i18next'
import { IMPORT_LIMITS } from '@domain/transfer/import'
import type { ImportFatal, ImportPreview } from '@shared/ipc'
import { Button, Dialog } from '@ui'
import styles from './ImportDialog.module.css'

/** FR-020: the dialog lists the first 20 row errors */
const SHOWN_ERRORS = 20

interface Props {
  preview: ImportPreview
  onConfirm(token: string): void
  onClose(): void
}

/** Spec 008 FR-020: what the import would do; nothing changes before "Import". */
export function ImportDialog({ preview, onConfirm, onClose }: Props) {
  const { t, i18n } = useTranslation()
  const number = (value: number) => new Intl.NumberFormat(i18n.language).format(value)

  const fatalText = (fatal: ImportFatal) => {
    if (fatal.reason === 'missingColumns') {
      const names = fatal.columns.map((column) => t(`transfer.columns.${column}`))
      const columns = new Intl.ListFormat(i18n.language, { type: 'conjunction' }).format(names)
      return t('transfer.fatal.missingColumns', { columns })
    }
    return t(`transfer.fatal.${fatal.reason}`, {
      size: `${number(IMPORT_LIMITS.bytes / 1024 / 1024)} MB`,
      rows: number(IMPORT_LIMITS.rows),
    })
  }

  const { token } = preview
  // The native dialog focuses the first button: Cancel, so Enter never imports by accident
  const footer = token ? (
    <>
      <Button onClick={onClose}>{t('form.cancel')}</Button>
      <Button variant="primary" onClick={() => onConfirm(token)}>
        {t('transfer.confirm', { count: preview.toAdd })}
      </Button>
    </>
  ) : (
    <Button variant="primary" onClick={onClose}>
      {t('common.close')}
    </Button>
  )

  return (
    <Dialog
      title={t('transfer.importTitle')}
      subtitle={preview.fileName}
      onClose={onClose}
      testId="import-dialog"
      footer={footer}
    >
      {preview.fatal ? (
        <p>{fatalText(preview.fatal)}</p>
      ) : (
        <>
          <ul className={styles.summary}>
            <li>
              {preview.toAdd > 0
                ? t('transfer.toAdd', { count: preview.toAdd })
                : t('transfer.nothingToAdd')}
            </li>
            {preview.hidden > 0 && <li>{t('transfer.hidden', { count: preview.hidden })}</li>}
            {preview.duplicates > 0 && (
              <li>{t('transfer.duplicates', { count: preview.duplicates })}</li>
            )}
            {preview.errors.length > 0 && (
              <li>
                {t('transfer.errors', { count: new Set(preview.errors.map((e) => e.row)).size })}
              </li>
            )}
          </ul>
          {preview.errors.length > 0 && (
            <ul className={styles.errors} data-testid="import-errors">
              {preview.errors.slice(0, SHOWN_ERRORS).map((error) => (
                <li key={`${error.row}-${error.field}`}>
                  {t('transfer.rowError', {
                    row: error.row,
                    field: t(`transfer.columns.${error.field}`),
                    problem: t(`transfer.problems.${error.problem}`),
                  })}
                </li>
              ))}
              {preview.errors.length > SHOWN_ERRORS && (
                <li>{t('transfer.moreErrors', { count: preview.errors.length - SHOWN_ERRORS })}</li>
              )}
            </ul>
          )}
        </>
      )}
    </Dialog>
  )
}
