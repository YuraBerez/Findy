import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NEW_ISSUE_URL, PROJECT_URL, SUPPORT_URL } from '@shared/project'
import { Button, Dialog } from '@ui'
import styles from './OfferDialog.module.css'

interface Props {
  /** FR-004: a final answer; resolves to false when it could not be saved */
  onAnswer(): Promise<boolean>
  onOpenLink(url: string): void
  onClose(): void
}

type Step = 'ask' | 'support' | 'feedback'

/**
 * Spec 013 US-1: congratulations on an offer and one question. Yes leads to support,
 * Not really to feedback; the close button, Escape and a click outside only close it
 * (FR-003, D-7).
 */
export function OfferDialog({ onAnswer, onOpenLink, onClose }: Props) {
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>('ask')

  const answer = async (next: Step | null) => {
    if (!(await onAnswer())) return
    if (next) setStep(next)
    else onClose()
  }
  const open = (url: string) => {
    onOpenLink(url)
    onClose()
  }

  if (step === 'support') {
    return (
      <Dialog
        title={t('support.thanksTitle')}
        onClose={onClose}
        closeLabel={t('common.close')}
        testId="offer-dialog"
        footer={
          <>
            <Button onClick={() => open(PROJECT_URL)}>{t('support.star')}</Button>
            <Button variant="primary" autoFocus onClick={() => open(SUPPORT_URL)}>
              {t('support.kofi')}
            </Button>
          </>
        }
      >
        <p>{t('support.thanksText')}</p>
      </Dialog>
    )
  }

  if (step === 'feedback') {
    return (
      <Dialog
        title={t('support.feedbackTitle')}
        onClose={onClose}
        closeLabel={t('common.close')}
        testId="offer-dialog"
        footer={
          <Button variant="primary" autoFocus onClick={() => open(NEW_ISSUE_URL)}>
            {t('support.feedback')}
          </Button>
        }
      >
        <p>{t('support.feedbackText')}</p>
      </Dialog>
    )
  }

  return (
    <Dialog
      title={t('support.offerTitle')}
      onClose={onClose}
      closeLabel={t('common.close')}
      testId="offer-dialog"
      footer={
        <>
          <Button variant="ghost" className={styles.dontAsk} onClick={() => void answer(null)}>
            {t('support.dontAsk')}
          </Button>
          <Button onClick={() => void answer('feedback')}>{t('support.notReally')}</Button>
          <Button variant="primary" autoFocus onClick={() => void answer('support')}>
            {t('support.yes')}
          </Button>
        </>
      }
    >
      <p>{t('support.offerQuestion')}</p>
    </Dialog>
  )
}
