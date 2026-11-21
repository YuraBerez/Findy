import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { stepStatus, type NextStep } from '@domain/nextStep'
import { Badge, Button, CalendarIcon, CheckIcon, PencilIcon, Section, TextField } from '@ui'
import { useNextStepForm } from '../useNextStepForm'
import { useStepLabels } from '../useStepLabels'
import styles from './NextStepSection.module.css'

interface Props {
  step: NextStep | null
  now: Date
  /** Resolves to false when saving failed (the failure is already notified) */
  onSave(step: NextStep): Promise<boolean>
  onRemove(): void
  /** FR-012: the step becomes a note */
  onDone(): void
  /** FR-040 */
  onAddToCalendar(): void
  /** FR-013: opened from the card menu; the focus goes to the step */
  focus?: boolean
}

/** Spec 015 FR-010…FR-012: the next step in the details panel. */
export function NextStepSection({
  step,
  now,
  onSave,
  onRemove,
  onDone,
  onAddToCalendar,
  focus = false,
}: Props) {
  const { t } = useTranslation()
  // FR-013: opened from the card menu, the form opens at once when there is no step
  const [editing, setEditing] = useState(focus && !step)

  return (
    <Section title={t('nextStep.title')}>
      {editing ? (
        <NextStepForm
          step={step}
          onCancel={() => setEditing(false)}
          onSave={async (next) => {
            if (await onSave(next)) setEditing(false)
          }}
        />
      ) : step ? (
        <StepView
          step={step}
          now={now}
          focus={focus}
          onEdit={() => setEditing(true)}
          onDone={onDone}
          onRemove={onRemove}
          onAddToCalendar={onAddToCalendar}
        />
      ) : (
        <Button onClick={() => setEditing(true)}>
          <CalendarIcon size={14} />
          {t('nextStep.add')}
        </Button>
      )}
    </Section>
  )
}

interface StepViewProps {
  step: NextStep
  now: Date
  /** FR-013: the dialog focuses "Edit" when it opens */
  focus: boolean
  onEdit(): void
  onDone(): void
  onRemove(): void
  onAddToCalendar(): void
}

function StepView({ step, now, focus, onEdit, onDone, onRemove, onAddToCalendar }: StepViewProps) {
  const { t } = useTranslation()
  const labels = useStepLabels()
  const status = stepStatus(step, now)
  return (
    <div data-testid="next-step">
      <p className={styles.text}>{step.text}</p>
      <p className={styles.when}>
        {labels.when(step)}
        {status !== 'later' && <Badge>{t(`nextStep.status.${status}`)}</Badge>}
      </p>
      <div className={styles.actions}>
        <Button size="small" variant="primary" onClick={onDone}>
          <CheckIcon size={14} />
          {t('nextStep.done')}
        </Button>
        <Button size="small" autoFocus={focus} onClick={onEdit}>
          <PencilIcon size={14} />
          {t('nextStep.edit')}
        </Button>
        <Button size="small" onClick={onAddToCalendar}>
          <CalendarIcon size={14} />
          {t('nextStep.calendar')}
        </Button>
        <Button size="small" variant="ghost" className={styles.remove} onClick={onRemove}>
          {t('nextStep.remove')}
        </Button>
      </div>
    </div>
  )
}

interface FormProps {
  step: NextStep | null
  onSave(step: NextStep): Promise<void>
  onCancel(): void
}

function NextStepForm({ step, onSave, onCancel }: FormProps) {
  const { t } = useTranslation()
  const form = useNextStepForm(step)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // The details form around it must not save too
    event.stopPropagation()
    const next = form.validate(event)
    if (next) await onSave(next)
  }
  return (
    <form noValidate className={styles.form} onSubmit={submit} data-testid="next-step-form">
      <TextField
        name="step-text"
        label={t('nextStep.text')}
        placeholder={t('nextStep.textHint')}
        value={form.values.text}
        error={form.errorText('text')}
        autoComplete="off"
        autoFocus
        // The details dialog focuses it when it opens with the form (FR-013)
        data-autofocus
        onChange={(event) => form.set('text', event.target.value)}
      />
      <div className={styles.when}>
        <TextField
          name="step-date"
          type="date"
          label={t('nextStep.date')}
          value={form.values.date}
          error={form.errorText('date')}
          onChange={(event) => form.set('date', event.target.value)}
        />
        <TextField
          name="step-time"
          type="time"
          label={t('nextStep.time')}
          hint={t('nextStep.timeHint')}
          value={form.values.time}
          error={form.errorText('time')}
          onChange={(event) => form.set('time', event.target.value)}
        />
      </div>
      <div className={styles.formActions}>
        <Button onClick={onCancel}>{t('nextStep.cancel')}</Button>
        <Button type="submit" variant="primary">
          {t('nextStep.save')}
        </Button>
      </div>
    </form>
  )
}
