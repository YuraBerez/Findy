import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  SOURCE_CHANNELS,
  sourceName,
  type ApplicationFields,
  type ApplicationSource,
  type Salary,
  type SourceChannel,
  type WorkFormat,
} from '@domain/fields'
import { formatMoney } from '../../format'

/** Spec 014: the names and the short text of the extra fields in the active language. */
export function useFieldLabels() {
  const { t, i18n } = useTranslation()
  // One object per language, so a memo that depends on it stays valid
  const channels = useMemo(
    () =>
      Object.fromEntries(
        SOURCE_CHANNELS.map((id) => [id, t(`fields.channels.${id}`)]),
      ) as Record<SourceChannel, string>,
    [t],
  )

  /** FR-031: "$3,000 – $4,000/mo", "from $3,000/mo", "up to $4,000/mo" */
  const salary = ({ min, max, currency, period }: Salary): string => {
    const amount = formatMoney({ min, max }, currency, i18n.language)
    const text =
      min !== null && max !== null
        ? amount
        : t(min !== null ? 'fields.salaryFromOnly' : 'fields.salaryToOnly', { amount })
    return text + t(`fields.periodShort.${period}`)
  }

  return {
    channels,
    workFormat: (format: WorkFormat) => t(`fields.workFormats.${format}`),
    source: (source: ApplicationSource) => sourceName(source, channels),
    salary,
    /** FR-030: the work format and the salary of a card, or null when both are empty */
    cardLine: ({ workFormat, salary: pay }: ApplicationFields): string | null => {
      const parts = [workFormat && t(`fields.workFormats.${workFormat}`), pay && salary(pay)]
      const line = parts.filter(Boolean).join(' · ')
      return line || null
    },
  }
}
