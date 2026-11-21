import { useTranslation } from 'react-i18next'
import {
  formatStepDay,
  formatStepTime,
  formatStepWhen,
  stepStatus,
  type NextStep,
  type StepStatus,
} from '@domain/nextStep'

/** Spec 015 FR-020, FR-022: the text of a step mark and its full date, in the UI language. */
export function useStepLabels() {
  const { t, i18n } = useTranslation()
  const language = i18n.language

  const mark = (step: NextStep, now: Date): { status: StepStatus; text: string } => {
    const status = stepStatus(step, now)
    const time = step.time === null ? null : formatStepTime(step.time, language)
    const day = formatStepDay(step, language, now)
    if (status === 'overdue') return { status, text: t('nextStep.mark.overdue', { day }) }
    const key = time === null ? status : `${status}At`
    return { status, text: t(`nextStep.mark.${key}`, { day, time }) }
  }

  return {
    mark,
    /** "Thu, Nov 26, 2026, 3:00 PM" */
    when: (step: NextStep) => formatStepWhen(step, language, { weekday: true }),
    /** FR-022: the step text and the full date, for the card's accessible name */
    label: (step: NextStep, now: Date) =>
      t('nextStep.cardLabel', {
        text: step.text,
        when: formatStepWhen(step, language, { weekday: true }),
        mark: mark(step, now).text,
      }),
  }
}
