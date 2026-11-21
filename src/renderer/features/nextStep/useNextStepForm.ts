import { useState, type FormEvent } from 'react'
import {
  NEXT_STEP_FORM_ORDER,
  nextStepFormValuesOf,
  validateNextStepForm,
  type NextStep,
  type NextStepFormErrors,
  type NextStepFormValues,
} from '@domain/nextStep'
import { useFieldErrorText } from '../../hooks/useFieldErrorText'

/** Spec 015 FR-010, US-1.3: state, validation and errors of the step form */
export function useNextStepForm(step: NextStep | null) {
  const errorText = useFieldErrorText()
  const [values, setValues] = useState(() => nextStepFormValuesOf(step))
  const [errors, setErrors] = useState<NextStepFormErrors>({})

  const set = (field: keyof NextStepFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      if (!(field in current)) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  /** The valid step, or `null` after showing the errors and focusing the first one */
  const validate = (event: FormEvent<HTMLFormElement>): NextStep | null => {
    const result = validateNextStepForm(values)
    if (result.ok) return result.data
    setErrors(result.errors)
    const first = NEXT_STEP_FORM_ORDER.find((field) => result.errors[field])
    event.currentTarget.querySelector<HTMLElement>(`[name="step-${first}"]`)?.focus()
    return null
  }

  return {
    values,
    set,
    validate,
    errorText: (field: keyof NextStepFormValues) => errorText(errors[field]),
  }
}
