import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { EMPTY_FORM, type ValidApplication } from '@domain/forms'
import { firstVisibleStage, visibleStages, type StageId } from '@domain/stages'
import { Button, Dialog } from '@ui'
import { ApplicationFields } from '../ApplicationFields'
import { useApplicationForm } from '../useApplicationForm'

interface Props {
  hiddenStages: StageId[]
  onClose(): void
  /** Closing on success is the caller's job; a failure is notified there */
  onSubmit(application: ValidApplication): Promise<void>
}

/** US-1: create an application. Mount it to open it; the form starts empty each time. */
export function ApplicationDialog({ hiddenStages, onClose, onSubmit }: Props) {
  const { t } = useTranslation()
  // FR-007: start in the first visible column
  const form = useApplicationForm({ ...EMPTY_FORM, stage: firstVisibleStage(hiddenStages) })
  const [saving, setSaving] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = form.validate(event)
    if (!data) return
    setSaving(true)
    try {
      await onSubmit(data)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      title={t('form.createTitle')}
      closeLabel={t('common.close')}
      onClose={onClose}
      onSubmit={submit}
      footer={
        <>
          <Button onClick={onClose}>{t('form.cancel')}</Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {t('form.create')}
          </Button>
        </>
      }
    >
      <ApplicationFields form={form} stages={visibleStages(hiddenStages)} />
    </Dialog>
  )
}
