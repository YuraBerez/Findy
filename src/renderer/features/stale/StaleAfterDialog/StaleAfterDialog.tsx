import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { isStaleAfterDays, STALE_DAYS } from '@domain/stale'
import { Button, Dialog, TextField } from '@ui'

interface Props {
  days: number
  onClose(): void
  /** Closing on success is the caller's job; a failure is notified there */
  onSave(days: number): Promise<void>
}

/** Spec 010 FR-008: after how many days an application is stale (3–90). */
export function StaleAfterDialog({ days, onClose, onSave }: Props) {
  const { t } = useTranslation()
  const [value, setValue] = useState(String(days))
  const [invalid, setInvalid] = useState(false)
  const [saving, setSaving] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const text = value.trim()
    const number = /^\d+$/.test(text) ? Number(text) : Number.NaN
    if (!isStaleAfterDays(number)) {
      setInvalid(true)
      event.currentTarget.querySelector<HTMLElement>('[name="staleAfterDays"]')?.focus()
      return
    }
    setSaving(true)
    try {
      await onSave(number)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      title={t('stale.dialog.title')}
      closeLabel={t('common.close')}
      onClose={onClose}
      onSubmit={submit}
      footer={
        <>
          <Button onClick={onClose}>{t('form.cancel')}</Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {t('stale.dialog.save')}
          </Button>
        </>
      }
    >
      <TextField
        name="staleAfterDays"
        type="number"
        inputMode="numeric"
        min={STALE_DAYS.min}
        max={STALE_DAYS.max}
        label={t('stale.dialog.label')}
        hint={t('stale.dialog.hint', { min: STALE_DAYS.min, max: STALE_DAYS.max })}
        value={value}
        error={
          invalid
            ? t('stale.dialog.error', { min: STALE_DAYS.min, max: STALE_DAYS.max })
            : undefined
        }
        onChange={(event) => {
          setValue(event.target.value)
          setInvalid(false)
        }}
      />
    </Dialog>
  )
}
