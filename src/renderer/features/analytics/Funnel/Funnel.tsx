import { useTranslation } from 'react-i18next'
import type { FunnelStep } from '@domain/analytics'
import { formatShare } from '../../../format'
import { ChartCard } from '../ChartCard'
import styles from './Funnel.module.css'

interface Props {
  steps: FunnelStep[]
  /** Applications of the period that were rejected (FR-023) */
  rejected: number
}

/** US-4, FR-022, FR-023: how many applications reached each stage, and the share. */
export function Funnel({ steps, rejected }: Props) {
  const { t, i18n } = useTranslation()
  const share = (value: number) => formatShare(value, i18n.language)
  return (
    <ChartCard
      title={t('analytics.funnel.title')}
      table={{
        columns: [
          t('analytics.table.stage'),
          t('analytics.table.applications'),
          t('analytics.table.share'),
        ],
        rows: steps.map((step) => [t(`stages.${step.stage}`), step.count, share(step.share)]),
      }}
    >
      <p className={styles.hint}>{t('analytics.funnel.hint')}</p>
      <ol className={styles.steps}>
        {steps.map((step) => (
          <li key={step.stage} className={styles.step}>
            <span className={styles.name}>{t(`stages.${step.stage}`)}</span>
            <span className={styles.track} aria-hidden="true">
              <span
                className={styles.bar}
                style={{
                  width: `${step.share * 100}%`,
                  background: `var(--chart-${step.stage})`,
                }}
              />
            </span>
            <span className={styles.value}>
              {step.count} <span className={styles.share}>({share(step.share)})</span>
            </span>
          </li>
        ))}
      </ol>
      <p className={styles.rejected}>{t('analytics.funnel.rejected', { count: rejected })}</p>
    </ChartCard>
  )
}
