import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { formValuesOf, type ValidApplication } from '@domain/forms'
import { visibleStages } from '@domain/stages'
import type { Application, StageId } from '@shared/ipc'
import { Badge, Button, ConfirmDialog, Dialog, ExternalLinkIcon, Section } from '@ui'
import { formatDateTime } from '../../../format'
import { NotesPanel, type NoteActions } from '../../notes'
import { ApplicationFields } from '../ApplicationFields'
import { StageHistory } from '../StageHistory'
import { useApplicationForm } from '../useApplicationForm'
import styles from './ApplicationDetails.module.css'

interface Props {
  application: Application
  onClose(): void
  onSave(changes: ValidApplication): Promise<void>
  onDelete(): Promise<void>
  onOpenLink(url: string): void
  notes: NoteActions
  hiddenStages: StageId[]
}

/** US-4: view and edit an application, its notes (US-3) and stage history; delete it. */
export function ApplicationDetails({
  application,
  onClose,
  onSave,
  onDelete,
  onOpenLink,
  notes,
  hiddenStages,
}: Props) {
  const { t, i18n } = useTranslation()
  const form = useApplicationForm(formValuesOf(application))
  const [saved, setSaved] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const { url } = application
  const date = (iso: string) => formatDateTime(iso, i18n.language)

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = form.validate(event)
    if (!data) return
    await onSave(data)
    setSaved(true)
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
      <NotesPanel notes={application.notes} actions={notes} />

      <Section title={t('details.fields')}>
        <form noValidate className={styles.form} onSubmit={save} onChange={() => setSaved(false)}>
          <ApplicationFields form={form} stages={visibleStages(hiddenStages)} />
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
