import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  EMPTY_FORM,
  validateApplicationForm,
  type ApplicationFormValues,
  type FieldError,
  type FormErrors,
  type ValidApplication,
} from '@domain/forms'
import { STAGES, type StageId } from '@domain/stages'
import { Button, Dialog, Field, Select, TextField } from '@ui'

interface Props {
  onClose(): void
  onSubmit(application: ValidApplication): Promise<void>
}

const TEXT_FIELDS = ['title', 'company', 'url'] as const

/** US-1: create an application. Mount it to open it; the form starts empty each time. */
export function ApplicationDialog({ onClose, onSubmit }: Props) {
  const { t } = useTranslation()
  const [values, setValues] = useState<ApplicationFormValues>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [saveFailed, setSaveFailed] = useState(false)
  const [saving, setSaving] = useState(false)

  const set = (field: keyof ApplicationFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      if (!(field in current)) return current
      const next = { ...current }
      delete next[field as keyof FormErrors]
      return next
    })
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = validateApplicationForm(values)
    if (!result.ok) {
      setErrors(result.errors)
      const first = TEXT_FIELDS.find((field) => result.errors[field])
      if (first) event.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }
    setSaving(true)
    setSaveFailed(false)
    try {
      await onSubmit(result.data)
    } catch {
      setSaveFailed(true)
    } finally {
      setSaving(false)
    }
  }

  const message = (error: FieldError | undefined) =>
    error && t(`form.errors.${error.code}`, error.code === 'tooLong' ? { max: error.max } : {})

  const labels = { title: t('form.title'), company: t('form.company'), url: t('form.url') }

  return (
    <Dialog
      title={t('form.createTitle')}
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
      {TEXT_FIELDS.map((field) => (
        <TextField
          key={field}
          name={field}
          type={field === 'url' ? 'url' : 'text'}
          label={labels[field]}
          hint={field === 'url' ? t('form.urlHint') : undefined}
          value={values[field]}
          error={message(errors[field])}
          autoComplete="off"
          onChange={(event) => set(field, event.target.value)}
        />
      ))}
      <Field label={t('form.stage')}>
        {(control) => (
          <Select
            {...control}
            block
            name="stage"
            value={values.stage}
            onChange={(event) => set('stage', event.target.value as StageId)}
          >
            {STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {t(`stages.${stage}`)}
              </option>
            ))}
          </Select>
        )}
      </Field>
      {saveFailed && <p role="alert">{t('form.errors.saveFailed')}</p>}
    </Dialog>
  )
}
