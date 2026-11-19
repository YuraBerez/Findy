import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { validateSiteForm, type SiteFormErrors, type SiteFormValues } from '@domain/sites'
import { Button, Dialog, TextField } from '@ui'
import { useFieldErrorText } from '../../../hooks/useFieldErrorText'

interface Props {
  /** The site to edit; a new site when not given */
  initial?: SiteFormValues
  onClose(): void
  /** Closing on success is the caller's job; a failure is notified there */
  onSave(site: SiteFormValues): Promise<void>
}

const FIELDS = ['name', 'url'] as const

/** Spec 011 FR-010, FR-011: add or edit a site of the user's own. */
export function SiteDialog({ initial, onClose, onSave }: Props) {
  const { t } = useTranslation()
  const errorText = useFieldErrorText()
  const [values, setValues] = useState<SiteFormValues>(initial ?? { name: '', url: '' })
  const [errors, setErrors] = useState<SiteFormErrors>({})
  const [saving, setSaving] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = validateSiteForm(values)
    if (!result.ok) {
      setErrors(result.errors)
      const first = FIELDS.find((field) => result.errors[field])
      event.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }
    setSaving(true)
    try {
      await onSave(result.data)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      title={t(initial ? 'sites.dialog.editTitle' : 'sites.dialog.addTitle')}
      closeLabel={t('common.close')}
      onClose={onClose}
      onSubmit={submit}
      footer={
        <>
          <Button onClick={onClose}>{t('form.cancel')}</Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {t('sites.dialog.save')}
          </Button>
        </>
      }
    >
      {FIELDS.map((field) => (
        <TextField
          key={field}
          name={field}
          type={field === 'url' ? 'url' : 'text'}
          label={t(`sites.dialog.${field}`)}
          hint={field === 'url' ? t('sites.dialog.urlHint') : undefined}
          placeholder={field === 'url' ? 'https://…?q={query}' : undefined}
          value={values[field]}
          error={errorText(errors[field])}
          autoComplete="off"
          onChange={(event) => {
            setValues((current) => ({ ...current, [field]: event.target.value }))
            setErrors((current) => {
              const next = { ...current }
              delete next[field]
              return next
            })
          }}
        />
      ))}
    </Dialog>
  )
}
