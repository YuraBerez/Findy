import { useTranslation } from 'react-i18next'
import type { FieldError } from '@domain/forms'

/** Localised message of a domain field error; one place for every form. */
export function useFieldErrorText() {
  const { t } = useTranslation()
  return (error: FieldError | null | undefined): string | undefined =>
    error
      ? t(`form.errors.${error.code}`, error.code === 'tooLong' ? { max: error.max } : {})
      : undefined
}
