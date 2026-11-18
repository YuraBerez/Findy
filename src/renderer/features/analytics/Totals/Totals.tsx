import { useTranslation } from 'react-i18next'
import type { AnalyticsTotals } from '@domain/analytics'
import styles from './Totals.module.css'

const KEYS = ['applications', 'interviews', 'offers', 'rejections'] as const

/** US-5, FR-024: the main numbers of the period. */
export function Totals({ totals }: { totals: AnalyticsTotals }) {
  const { t, i18n } = useTranslation()
  const number = new Intl.NumberFormat(i18n.language)
  return (
    <dl className={styles.totals} aria-label={t('analytics.totals.label')}>
      {KEYS.map((key) => (
        <div key={key} className={styles.tile}>
          <dt className={styles.name}>{t(`analytics.totals.${key}`)}</dt>
          <dd className={styles.value}>{number.format(totals[key])}</dd>
        </div>
      ))}
    </dl>
  )
}
