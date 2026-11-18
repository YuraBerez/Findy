import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { AnalyticsGrouping, Bucket } from '@domain/analytics'
import { formatBucket } from '../../format'

export interface BucketLabels {
  /** For the chart axis */
  short: string[]
  /** For captions and tables */
  long: string[]
}

/** FR-012, NFR-001: bucket names in the active locale */
export function useBucketLabels(buckets: Bucket[], grouping: AnalyticsGrouping): BucketLabels {
  const { i18n } = useTranslation()
  const language = i18n.language
  return useMemo(
    () => ({
      short: buckets.map((bucket) => formatBucket(bucket.start, grouping, language, 'short')),
      long: buckets.map((bucket) => formatBucket(bucket.start, grouping, language, 'long')),
    }),
    [buckets, grouping, language],
  )
}
