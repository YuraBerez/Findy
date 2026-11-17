import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  EMPTY_FORM,
  validateApplicationForm,
  type ApplicationFormValues,
  type FieldError,
  type FormErrors,
  type ValidApplication,
} from '../../domain/forms'
import { STAGES, type StageId } from '../../domain/stages'
import styles from './ApplicationDialog.module.css'

interface Props {
  open: boolean
  onClose(): void
  onSubmit(application: ValidApplication): Promise<void>
}

type Field = keyof FormErrors

/** US-1: create an application. Native <dialog> gives focus trap and Esc to close. */
export function ApplicationDialog({ open, onClose, onSubmit }: Props) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDialogElement>(null)
  const ids = { title: useId(), company: useId(), url: useId(), stage: useId() }
  const [values, setValues] = useState<ApplicationFormValues>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [saveFailed, setSaveFailed] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      setValues(EMPTY_FORM)
      setErrors({})
      setSaveFailed(false)
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  const set = (field: keyof ApplicationFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    if (field in errors) {
      setErrors((current) => {
        const next = { ...current }
        delete next[field as Field]
        return next
      })
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const result = validateApplicationForm(values)
    if (!result.ok) {
      setErrors(result.errors)
      const first = (['title', 'company', 'url'] as const).find((field) => result.errors[field])
      if (first) document.getElementById(ids[first])?.focus()
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

  const message = (error: FieldError) =>
    t(`form.errors.${error.code}`, error.code === 'tooLong' ? { max: error.max } : {})

  const textField = (
    field: Field,
    label: string,
    options: { hint?: string; type?: string } = {},
  ) => {
    const error = errors[field]
    const describedBy = [error && `${ids[field]}-error`, options.hint && `${ids[field]}-hint`]
      .filter(Boolean)
      .join(' ')
    return (
      <div className={styles.field}>
        <label htmlFor={ids[field]}>
          {label}
          {options.hint && (
            <span id={`${ids[field]}-hint`} className={styles.hint}>
              {' '}
              ({options.hint})
            </span>
          )}
        </label>
        <input
          id={ids[field]}
          name={field}
          type={options.type ?? 'text'}
          value={values[field]}
          onChange={(event) => set(field, event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          autoComplete="off"
        />
        {error && (
          <p id={`${ids[field]}-error`} className={styles.error}>
            {message(error)}
          </p>
        )}
      </div>
    )
  }

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={`${ids.title}-heading`}
      onClose={onClose}
    >
      <form noValidate onSubmit={submit}>
        <h2 id={`${ids.title}-heading`} className={styles.heading}>
          {t('form.createTitle')}
        </h2>
        {textField('title', t('form.title'))}
        {textField('company', t('form.company'))}
        {textField('url', t('form.url'), { hint: t('form.urlHint'), type: 'url' })}
        <div className={styles.field}>
          <label htmlFor={ids.stage}>{t('form.stage')}</label>
          <select
            id={ids.stage}
            name="stage"
            value={values.stage}
            onChange={(event) => set('stage', event.target.value as StageId)}
          >
            {STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {t(`stages.${stage}`)}
              </option>
            ))}
          </select>
        </div>
        {saveFailed && (
          <p role="alert" className={styles.error}>
            {t('form.errors.saveFailed')}
          </p>
        )}
        <div className={styles.actions}>
          <button type="button" className="button" onClick={onClose}>
            {t('form.cancel')}
          </button>
          <button type="submit" className="button button--primary" disabled={saving}>
            {t('form.create')}
          </button>
        </div>
      </form>
    </dialog>
  )
}
