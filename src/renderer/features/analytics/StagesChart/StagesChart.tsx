import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { StageSeries } from '@domain/analytics'
import type { StageId } from '@domain/stages'
import { BarChart, ChartLegend } from '@ui'
import type { BucketLabels } from '../useBucketLabels'
import { ChartCard } from '../ChartCard'

interface Props {
  labels: BucketLabels
  /** Visible stages in board order (FR-015) */
  series: StageSeries[]
}

const color = (stage: StageId) => `var(--chart-${stage})`

/** US-3, FR-021: stage entries per bucket, stacked; the legend turns stages on and off. */
export function StagesChart({ labels, series }: Props) {
  const { t, i18n } = useTranslation()
  const [off, setOff] = useState<ReadonlySet<StageId>>(new Set())
  const shown = series.filter((s) => !off.has(s.stage))
  const title = t('analytics.stages.title')
  const name = (stage: StageId) => t(`stages.${stage}`)

  const describe = (i: number) => {
    const parts = shown
      .filter((s) => s.values[i])
      .map((s) => t('analytics.stages.item', { stage: name(s.stage), count: s.values[i] }))
    if (parts.length === 0) return t('analytics.stages.none', { date: labels.long[i] })
    const list = new Intl.ListFormat(i18n.language, { type: 'unit' }).format(parts)
    return t('analytics.stages.value', { date: labels.long[i], list })
  }

  const toggle = (key: string) => {
    const next = new Set(off)
    if (!next.delete(key as StageId)) next.add(key as StageId)
    setOff(next)
  }

  return (
    <ChartCard
      title={title}
      table={{
        columns: [t('analytics.table.period'), ...shown.map((s) => name(s.stage))],
        rows: labels.long.map((label, i) => [label, ...shown.map((s) => s.values[i]!)]),
      }}
    >
      <ChartLegend
        label={t('analytics.stages.legend')}
        items={series.map((s) => ({
          key: s.stage,
          label: name(s.stage),
          color: color(s.stage),
          shown: !off.has(s.stage),
        }))}
        onToggle={toggle}
      />
      <BarChart
        label={title}
        categories={labels.short}
        series={shown.map((s) => ({ key: s.stage, color: color(s.stage), values: s.values }))}
        describe={describe}
        hint={t('analytics.chartHint')}
      />
    </ChartCard>
  )
}
