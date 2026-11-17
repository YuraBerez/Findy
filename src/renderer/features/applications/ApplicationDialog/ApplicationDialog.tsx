import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { EMPTY_FORM, type ValidApplication } from '@domain/forms'
import { Button, Dialog } from '@ui'
import { ApplicationFields } from '../ApplicationFields'
import { useApplicationForm } from '../useApplicationForm'

interface Props {
  onClose(): void
  onSubmit(application: ValidApplication): Promise<void>
}

/** US-1: create an application. Mount it to open it; the form starts empty each time. */
export function ApplicationDialog({ onClose, onSubmit }: Props) {
  const { t } = useTranslation()
  const form = useApplicationForm(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = form.validate(event)
    if (!data) return
    setSaving(true)
    setSaveFailed(false)
    try {
      await onSubmit(data)
    } catch {
      setSaveFailed(true)
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
      <ApplicationFields form={form} />
      {saveFailed && <p role="alert">{t('form.errors.saveFailed')}</p>}
    </Dialog>
  )
}
