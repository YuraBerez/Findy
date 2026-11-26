import { useTranslation } from 'react-i18next'
import type { AnalyticsTotals } from '@domain/analytics'
import styles from './Totals.module.css'

const KEYS = ['applications', 'interviews', 'offers', 'rejections'] as const

interface Props {
  totals: AnalyticsTotals
  /** Spec 022: days since the first application, the first tile */
  searchDays: number
}

/** US-5, FR-024: the main numbers of the period. */
export function Totals({ totals, searchDays }: Props) {
  const { t, i18n } = useTranslation()
  const number = new Intl.NumberFormat(i18n.language)
  const tiles = [
    { key: 'searchDays', value: searchDays },
    ...KEYS.map((key) => ({ key, value: totals[key] })),
  ]
  return (
    <dl className={styles.totals} aria-label={t('analytics.totals.label')}>
      {tiles.map(({ key, value }) => (
        <div key={key} className={styles.tile}>
          <dt className={styles.name}>{t(`analytics.totals.${key}`)}</dt>
          <dd className={styles.value}>{number.format(value)}</dd>
        </div>
      ))}
    </dl>
  )
}
