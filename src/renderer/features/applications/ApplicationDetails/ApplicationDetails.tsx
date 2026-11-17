import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { formValuesOf, type ValidApplication } from '@domain/forms'
import type { Application } from '@shared/ipc'
import { Button, ConfirmDialog, Dialog, ExternalLinkIcon } from '@ui'
import { formatDateTime } from '../../../format'
import { NotesPanel, type NoteActions } from '../../notes'
import { ApplicationFields } from '../ApplicationFields'
import { useApplicationForm } from '../useApplicationForm'
import styles from './ApplicationDetails.module.css'

interface Props {
  application: Application
  onClose(): void
  onSave(changes: ValidApplication): Promise<void>
  onDelete(): Promise<void>
  onOpenLink(url: string): void
  notes: NoteActions
}

/** US-4: view and edit an application, its stage history and notes (US-3); delete it. */
export function ApplicationDetails({
  application,
  onClose,
  onSave,
  onDelete,
  onOpenLink,
  notes,
}: Props) {
  const { t, i18n } = useTranslation()
  const form = useApplicationForm(formValuesOf(application))
  const [saved, setSaved] = useState(false)
  const [confirming, setConfirming] = useState(false)
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
      title={application.title}
      onClose={onClose}
      testId="details"
      footer={
        <>
          <Button variant="danger" className={styles.delete} onClick={() => setConfirming(true)}>
            {t('details.delete')}
          </Button>
          <Button onClick={onClose}>{t('details.close')}</Button>
        </>
      }
    >
      <div className={styles.summary}>
        <span className={styles.company}>{application.company}</span>
        {application.url && (
          <Button size="small" onClick={() => onOpenLink(application.url!)}>
            <ExternalLinkIcon size={14} /> {t('details.openVacancy')}
          </Button>
        )}
      </div>

      <form noValidate onSubmit={save} onChange={() => setSaved(false)}>
        <ApplicationFields form={form} />
        <div className={styles.saveRow}>
          <span role="status" className={styles.saved}>
            {saved ? t('details.saved') : ''}
          </span>
          <Button type="submit" variant="primary">
            {t('details.save')}
          </Button>
        </div>
      </form>

      <section className={styles.section} aria-labelledby="history-heading">
        <h3 id="history-heading" className={styles.heading}>
          {t('details.history')}
        </h3>
        <ol className={styles.history}>
          {application.stageHistory.map((change, index) => (
            <li key={index}>
              <span>{t(`stages.${change.stage}`)}</span>
              <time dateTime={change.at}>{date(change.at)}</time>
            </li>
          ))}
        </ol>
        <p className={styles.dates}>
          {t('details.created', { date: date(application.createdAt) })} ·{' '}
          {t('details.updated', { date: date(application.updatedAt) })}
        </p>
      </section>

      <NotesPanel notes={application.notes} actions={notes} />

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
