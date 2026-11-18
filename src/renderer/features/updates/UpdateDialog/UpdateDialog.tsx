import { useTranslation } from 'react-i18next'
import type { UpdateCheckResult } from '@shared/ipc'
import { Button, Dialog } from '@ui'

interface Props {
  result: UpdateCheckResult
  onDownload(url: string): void
  onClose(): void
}

/** Spec 006 FR-007…FR-009: a new version with "Download" and "Later", or "up to date". */
export function UpdateDialog({ result, onDownload, onClose }: Props) {
  const { t } = useTranslation()
  if (result.status === 'latest') {
    return (
      <Dialog
        title={t('updates.latestTitle')}
        onClose={onClose}
        testId="update-dialog"
        footer={
          <Button variant="primary" autoFocus onClick={onClose}>
            {t('common.ok')}
          </Button>
        }
      >
        <p>{t('updates.latestText', { current: result.currentVersion })}</p>
      </Dialog>
    )
  }
  return (
    // Escape and a click outside mean "Later" (FR-007)
    <Dialog
      title={t('updates.availableTitle')}
      onClose={onClose}
      testId="update-dialog"
      footer={
        <>
          <Button onClick={onClose}>{t('updates.later')}</Button>
          <Button variant="primary" autoFocus onClick={() => onDownload(result.url)}>
            {t('updates.download')}
          </Button>
        </>
      }
    >
      <p>
        {t('updates.availableText', {
          version: result.version,
          current: result.currentVersion,
        })}
      </p>
    </Dialog>
  )
}
