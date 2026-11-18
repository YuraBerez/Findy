import { useTranslation } from 'react-i18next'
import {
  ANALYTICS_GROUPINGS,
  ANALYTICS_PERIODS,
  isAnalyticsGrouping,
  isAnalyticsPeriod,
  type AnalyticsView,
} from '@domain/analytics'
import { Field, Select } from '@ui'
import styles from './AnalyticsFilters.module.css'

interface Props {
  view: AnalyticsView
  onChange(view: AnalyticsView): void
}

/** US-6, FR-030, FR-031: period and grouping for every chart and total. */
export function AnalyticsFilters({ view, onChange }: Props) {
  const { t } = useTranslation()
  return (
    <div className={styles.filters}>
      <Field label={t('analytics.period.label')}>
        {(control) => (
          <Select
            {...control}
            value={view.period}
            onChange={(event) => {
              const period = event.target.value
              if (isAnalyticsPeriod(period)) onChange({ ...view, period })
            }}
          >
            {ANALYTICS_PERIODS.map((period) => (
              <option key={period} value={period}>
                {t(`analytics.period.${period}`)}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label={t('analytics.grouping.label')}>
        {(control) => (
          <Select
            {...control}
            value={view.grouping}
            onChange={(event) => {
              const grouping = event.target.value
              if (isAnalyticsGrouping(grouping)) onChange({ ...view, grouping })
            }}
          >
            {ANALYTICS_GROUPINGS.map((grouping) => (
              <option key={grouping} value={grouping}>
                {t(`analytics.grouping.${grouping}`)}
              </option>
            ))}
          </Select>
        )}
      </Field>
    </div>
  )
}
