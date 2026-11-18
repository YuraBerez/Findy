import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { analytics, type AnalyticsView } from '@domain/analytics'
import type { StageId } from '@domain/stages'
import type { Application } from '@shared/ipc'
import { Button } from '@ui'
import { ActivityChart } from '../ActivityChart'
import { AnalyticsFilters } from '../AnalyticsFilters'
import { Funnel } from '../Funnel'
import { StagesChart } from '../StagesChart'
import { Totals } from '../Totals'
import { useBucketLabels } from '../useBucketLabels'
import styles from './Analytics.module.css'

interface Props {
  applications: Application[]
  hiddenStages: StageId[]
  view: AnalyticsView
  onViewChange(view: AnalyticsView): void
  /** FR-040: the empty state opens the board */
  onShowBoard(): void
}

/** Spec 005: the analytics screen. Numbers follow every new state (FR-033). */
export function Analytics({ applications, hiddenStages, view, onViewChange, onShowBoard }: Props) {
  const { t } = useTranslation()
  // A new "now" with every change of data or view, so midnight moves "today"
  const data = useMemo(
    () => analytics({ applications, hiddenStages, view, now: new Date() }),
    [applications, hiddenStages, view],
  )
  const labels = useBucketLabels(data.buckets, view.grouping)

  if (applications.length === 0) {
    return (
      <section className={styles.empty} data-testid="empty-analytics">
        <h2>{t('analytics.empty.title')}</h2>
        <p>{t('analytics.empty.text')}</p>
        <Button variant="primary" onClick={onShowBoard}>
          {t('analytics.empty.action')}
        </Button>
      </section>
    )
  }

  return (
    <div className={styles.analytics}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t('views.analytics')}</h2>
        <AnalyticsFilters view={view} onChange={onViewChange} />
      </div>
      {data.noActivity && (
        <p className={styles.note} role="status">
          {t('analytics.noActivity')}
        </p>
      )}
      <Totals totals={data.totals} />
      <div className={styles.grid}>
        <ActivityChart labels={labels} values={data.activity} />
        <StagesChart labels={labels} series={data.stages} />
        <Funnel steps={data.funnel} rejected={data.rejected} />
      </div>
    </div>
  )
}
