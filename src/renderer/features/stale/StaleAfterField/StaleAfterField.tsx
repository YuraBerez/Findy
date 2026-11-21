import { useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { isStaleAfterDays, STALE_DAYS } from '@domain/stale'
import { TextField } from '@ui'

interface Props {
  days: number
  /** Resolves to false when saving failed (the failure is already notified) */
  onSave(days: number): Promise<boolean>
}

/**
 * Spec 010 FR-008, spec 018 FR-013: after how many days an application is stale (3–90).
 * Saves when the field loses focus or on Enter; an invalid value is not saved.
 */
export function StaleAfterField({ days, onSave }: Props) {
  const { t } = useTranslation()
  const [value, setValue] = useState(String(days))
  const [invalid, setInvalid] = useState(false)

  const save = async () => {
    const text = value.trim()
    const number = /^\d+$/.test(text) ? Number(text) : Number.NaN
    if (!isStaleAfterDays(number)) {
      setInvalid(true)
      return
    }
    if (number !== days && !(await onSave(number))) setValue(String(days))
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    void save()
  }

  return (
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
        invalid ? t('stale.dialog.error', { min: STALE_DAYS.min, max: STALE_DAYS.max }) : undefined
      }
      onChange={(event) => {
        setValue(event.target.value)
        setInvalid(false)
      }}
      onBlur={() => void save()}
      onKeyDown={onKeyDown}
    />
  )
}
