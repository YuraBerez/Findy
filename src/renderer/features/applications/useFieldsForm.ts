import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  FIELDS_FORM_ORDER,
  validateFieldsForm,
  type ApplicationFields,
  type FieldsFormErrors,
  type FieldsFormValues,
} from '@domain/fields'
import { useFieldErrorText } from '../../hooks/useFieldErrorText'

/**
 * Spec 014: state, validation and errors of the extra fields in the details form.
 * `saved` is the form of the saved application: a field that the user did not change
 * follows it, e.g. the source that main fills in from a new link (FR-020).
 */
export function useFieldsForm(saved: FieldsFormValues) {
  const errorText = useFieldErrorText()
  const [values, setValues] = useState(saved)
  const [errors, setErrors] = useState<FieldsFormErrors>({})
  const last = useRef(saved)
  const savedKey = JSON.stringify(saved)

  useEffect(() => {
    const previous = last.current
    last.current = saved
    setValues((current) => {
      const next = { ...current }
      for (const key of Object.keys(saved) as (keyof FieldsFormValues)[])
        if (current[key] === previous[key]) (next as Record<string, string>)[key] = saved[key]
      return next
    })
    // `saved` is a new object on every render; its content is what matters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedKey])

  const set = <K extends keyof FieldsFormValues>(field: K, value: FieldsFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      // "From" and "to" depend on each other (FR-002)
      const clear =
        field === 'salaryMin' || field === 'salaryMax' ? ['salaryMin', 'salaryMax'] : [field]
      if (!clear.some((key) => key in current)) return current
      const next = { ...current }
      for (const key of clear) delete next[key as keyof FieldsFormErrors]
      return next
    })
  }

  /**
   * Valid fields, or `null` after showing the errors. Focuses the first invalid field
   * unless `focus` is false (another part of the form already has an error).
   */
  const validate = (event: FormEvent<HTMLFormElement>, focus = true): ApplicationFields | null => {
    const result = validateFieldsForm(values)
    if (result.ok) return result.data
    setErrors(result.errors)
    const first = FIELDS_FORM_ORDER.find((field) => result.errors[field])
    if (focus && first) event.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
    return null
  }

  return {
    values,
    set,
    validate,
    errorText: (field: keyof FieldsFormErrors) => errorText(errors[field]),
  }
}

export type FieldsFormState = ReturnType<typeof useFieldsForm>
