import { useTranslation } from 'react-i18next'
import { BugIcon, Button } from '@ui'
import styles from './ReportIssueButton.module.css'

export const NEW_ISSUE_URL = 'https://github.com/YuraBerez/findy/issues/new/choose'

/** FR-074: report a problem on GitHub, from any screen. */
export function ReportIssueButton({ onOpenLink }: { onOpenLink(url: string): void }) {
  const { t } = useTranslation()
  return (
    <Button size="small" className={styles.button} onClick={() => onOpenLink(NEW_ISSUE_URL)}>
      <BugIcon size={14} />
      {t('feedback.reportIssue')}
    </Button>
  )
}
