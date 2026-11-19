import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  validateApplicationForm,
  type ApplicationFormValues,
  type FormErrors,
  type ValidApplication,
} from '@domain/forms'
import { useFieldErrorText } from '../../hooks/useFieldErrorText'

const ORDER = ['title', 'company', 'url'] as const

/** State, validation and errors of the application form: shared by "create" and "edit". */
export function useApplicationForm(initial: ApplicationFormValues) {
  const errorText = useFieldErrorText()
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<FormErrors>({})
  // The values of the last render, for answers that arrive later (spec 009 FR-003)
  const latest = useRef(values)
  useEffect(() => {
    latest.current = values
  }, [values])

  const set = (field: keyof ApplicationFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      if (!(field in current)) return current
      const next = { ...current }
      delete next[field as keyof FormErrors]
      return next
    })
  }

  /** Spec 009 FR-003: fills only the fields that are empty now; typed text stays */
  const fillEmpty = (data: Partial<Record<'title' | 'company', string | null>>) => {
    for (const field of ['title', 'company'] as const) {
      const value = data[field]
      if (value && !latest.current[field].trim()) set(field, value)
    }
  }

  /** Valid data, or `null` after showing the errors and focusing the first invalid field. */
  const validate = (event: FormEvent<HTMLFormElement>): ValidApplication | null => {
    const result = validateApplicationForm(values)
    if (result.ok) return result.data
    setErrors(result.errors)
    const first = ORDER.find((field) => result.errors[field])
    if (first) event.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
    return null
  }

  return {
    values,
    set,
    fillEmpty,
    validate,
    errorText: (field: keyof FormErrors) => errorText(errors[field]),
  }
}

export type ApplicationFormState = ReturnType<typeof useApplicationForm>
