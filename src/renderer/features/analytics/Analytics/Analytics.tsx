import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { analytics, type AnalyticsView } from '@domain/analytics'
import type { StageId } from '@domain/stages'
import type { Application } from '@shared/ipc'
import { Button } from '@ui'
import { ActivityChart } from '../ActivityChart'
import { AnalyticsFilters } from '../AnalyticsFilters'
import { Funnel } from '../Funnel'
import { ShareImageButton } from '../ShareImageButton'
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
  /** Spec 023 FR-021 */
  onCopyImage(png: Uint8Array): Promise<void>
  /** Spec 023 FR-022 */
  onSaveImage(png: Uint8Array): Promise<void>
}

/** Spec 005: the analytics screen. Numbers follow every new state (FR-033). */
export function Analytics({
  applications,
  hiddenStages,
  view,
  onViewChange,
  onShowBoard,
  onCopyImage,
  onSaveImage,
}: Props) {
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
        {/* Spec 023 FR-001: the share button on the right side of the filters */}
        <div className={styles.tools}>
          <AnalyticsFilters view={view} onChange={onViewChange} />
          <div className={styles.share}>
            <ShareImageButton
              data={data}
              period={view.period}
              onCopy={onCopyImage}
              onSave={onSaveImage}
            />
          </div>
        </div>
      </div>
      {data.noActivity && (
        <p className={styles.note} role="status">
          {t('analytics.noActivity')}
        </p>
      )}
      <Totals totals={data.totals} searchDays={data.searchDays} />
      <div className={styles.grid}>
        <ActivityChart labels={labels} values={data.activity} />
        <StagesChart labels={labels} series={data.stages} />
        <div className={styles.wide}>
          <Funnel steps={data.funnel} rejected={data.rejected} />
        </div>
      </div>
    </div>
  )
}
