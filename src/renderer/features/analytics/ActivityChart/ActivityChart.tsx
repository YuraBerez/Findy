import { useTranslation } from 'react-i18next'
import { BarChart } from '@ui'
import type { BucketLabels } from '../useBucketLabels'
import { ChartCard } from '../ChartCard'

interface Props {
  labels: BucketLabels
  /** Applications created per bucket */
  values: number[]
}

/** US-2, FR-020: applications sent per day, week or month. */
export function ActivityChart({ labels, values }: Props) {
  const { t } = useTranslation()
  const title = t('analytics.activity.title')
  const describe = (i: number) =>
    t('analytics.activity.value', { date: labels.long[i], count: values[i] })
  return (
    <ChartCard
      title={title}
      table={{
        columns: [t('analytics.table.period'), t('analytics.table.applications')],
        rows: values.map((value, i) => [labels.long[i]!, value]),
      }}
    >
      <BarChart
        label={title}
        categories={labels.short}
        series={[{ key: 'applications', color: 'var(--primary)', values }]}
        describe={describe}
        hint={t('analytics.chartHint')}
      />
    </ChartCard>
  )
}
