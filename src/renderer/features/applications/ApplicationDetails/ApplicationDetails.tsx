import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { formValuesOf, type ValidApplication } from '@domain/forms'
import type { CardColor } from '@domain/colors'
import { fieldsFormValuesOf, type ApplicationFields, type Currency } from '@domain/fields'
import type { CustomSite } from '@domain/sites'
import type { NextStep } from '@domain/nextStep'
import { visibleStages } from '@domain/stages'
import type { Application, StageId } from '@shared/ipc'
import { Badge, Button, ColorPicker, ConfirmDialog, Dialog, ExternalLinkIcon, Section } from '@ui'
import { formatDateTime } from '../../../format'
import { useColorOptions } from '../../colors'
import { NextStepSection } from '../../nextStep'
import { NotesPanel, type NoteActions } from '../../notes'
import { ApplicationExtraFields } from '../ApplicationExtraFields'
import { ApplicationFields as MainFields } from '../ApplicationFields'
import { StageHistory } from '../StageHistory'
import { useApplicationForm } from '../useApplicationForm'
import { useFieldsForm } from '../useFieldsForm'
import styles from './ApplicationDetails.module.css'

interface Props {
  application: Application
  onClose(): void
  /** Resolves to false when saving failed (the failure is already notified) */
  onSave(changes: ValidApplication & ApplicationFields): Promise<boolean>
  onDelete(): Promise<void>
  onOpenLink(url: string): void
  /** Spec 007 FR-007: saved at once, not with "Save changes" */
  onColorChange(color: CardColor | null): void
  notes: NoteActions
  hiddenStages: StageId[]
  /** Spec 014: the user's job sites, offered as sources */
  sites: readonly CustomSite[]
  /** Spec 014 FR-012: the currency of a new salary */
  defaultCurrency: Currency
  /** Spec 015: the next step; saved at once, not with "Save changes" */
  nextStep: {
    now: Date
    /** FR-013: opened from the card menu */
    focus: boolean
    save(step: NextStep): Promise<boolean>
    remove(): void
    done(): void
    addToCalendar(): void
  }
}

/** US-4: view and edit an application, its notes (US-3) and stage history; delete it. */
export function ApplicationDetails({
  application,
  onClose,
  onSave,
  onDelete,
  onOpenLink,
  onColorChange,
  notes,
  hiddenStages,
  sites,
  defaultCurrency,
  nextStep,
}: Props) {
  const { t, i18n } = useTranslation()
  const colors = useColorOptions()
  const form = useApplicationForm(formValuesOf(application))
  const fields = useFieldsForm(fieldsFormValuesOf(application, defaultCurrency))
  const [saved, setSaved] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const { url } = application
  const date = (iso: string) => formatDateTime(iso, i18n.language)

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = form.validate(event)
    // Both parts show their errors; the focus goes to the first invalid field
    const extra = fields.validate(event, data !== null)
    if (!data || !extra) return
    setSaved(await onSave({ ...data, ...extra }))
  }

  return (
    <Dialog
      variant="drawer"
      testId="details"
      title={application.title}
      closeLabel={t('common.close')}
      onClose={onClose}
      subtitle={
        <span className={styles.subtitle}>
          {application.company}
          <Badge>{t(`stages.${application.stage}`)}</Badge>
        </span>
      }
      headerExtra={
        url && (
          <Button size="small" onClick={() => onOpenLink(url)}>
            <ExternalLinkIcon size={14} />
            {t('details.openVacancy')}
          </Button>
        )
      }
      footer={
        <Button variant="danger" className={styles.delete} onClick={() => setConfirming(true)}>
          {t('details.delete')}
        </Button>
      }
    >
      <NextStepSection
        step={application.nextStep}
        now={nextStep.now}
        focus={nextStep.focus}
        onSave={nextStep.save}
        onRemove={nextStep.remove}
        onDone={nextStep.done}
        onAddToCalendar={nextStep.addToCalendar}
      />

      <NotesPanel notes={application.notes} actions={notes} />

      <Section title={t('details.fields')}>
        <form noValidate className={styles.form} onSubmit={save} onChange={() => setSaved(false)}>
          <MainFields form={form} stages={visibleStages(hiddenStages)} />
          <ApplicationExtraFields form={fields} sites={sites} onOpenLink={onOpenLink} />
          <div className={styles.saveRow}>
            <span role="status" className={styles.saved}>
              {saved ? t('details.saved') : ''}
            </span>
            <Button type="submit" variant="primary">
              {t('details.save')}
            </Button>
          </div>
        </form>
      </Section>

      <Section title={t('colors.title')}>
        <ColorPicker
          label={t('colors.title')}
          options={colors.options}
          value={colors.keyOf(application.color)}
          onChange={(key) => onColorChange(colors.colorOf(key))}
        />
      </Section>

      <Section title={t('details.history')}>
        <StageHistory history={application.stageHistory} />
        <p className={styles.dates}>
          {t('details.created', { date: date(application.createdAt) })} ·{' '}
          {t('details.updated', { date: date(application.updatedAt) })}
        </p>
      </Section>

      {confirming && (
        <ConfirmDialog
          title={t('details.deleteTitle')}
          message={t('details.deleteMessage', { title: application.title })}
          confirmLabel={t('details.delete')}
          cancelLabel={t('form.cancel')}
          onCancel={() => setConfirming(false)}
          onConfirm={async () => {
            setConfirming(false)
            await onDelete()
          }}
        />
      )}
    </Dialog>
  )
}
