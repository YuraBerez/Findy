import type { NextStep } from '@domain/nextStep'
import { AlertIcon, CalendarIcon } from '@ui'
import { useStepLabels } from '../useStepLabels'
import styles from './NextStepMark.module.css'

interface Props {
  step: NextStep
  now: Date
}

/**
 * Spec 015 FR-020…FR-022: "Today, 3:00 PM", "Overdue · Tue, Nov 24"… on the card. The
 * visible text is short; the full text and date are in the card's accessible name.
 */
export function NextStepMark({ step, now }: Props) {
  const labels = useStepLabels()
  const { status, text } = labels.mark(step, now)
  const Icon = status === 'overdue' ? AlertIcon : CalendarIcon
  return (
    <p className={styles.mark} data-status={status} data-testid="card-next-step" title={step.text}>
      <Icon size={14} className={styles.icon} />
      <span aria-hidden="true" className={styles.text}>
        {text}
      </span>
      <span className={styles.srOnly}>{labels.label(step, now)}</span>
    </p>
  )
}
