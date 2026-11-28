import type { AnalyticsData, AnalyticsPeriod } from '@domain/analytics'
import type { StageId } from '@domain/stages'
import { SITE_URL } from '@shared/project'
import { formatShare } from '../../../format'

export interface ShareTile {
  label: string
  value: string
}

export interface ShareFunnelRow {
  stage: StageId
  label: string
  /** "40" */
  count: string
  /** "25 %" */
  share: string
  /** Bar length, 0…1 */
  ratio: number
}

/** Spec 023 FR-011: everything the image shows, as text in the active language */
export interface ShareCard {
  title: string
  subtitle: string
  period: string
  tiles: ShareTile[]
  funnelTitle: string
  funnel: ShareFunnelRow[]
  /** The website address without the scheme and the last slash */
  site: string
}

type Translate = (key: string) => string

/** Spec D-8: no "Rejections" tile on the image */
const TILE_KEYS = ['applications', 'interviews', 'offers'] as const

/**
 * FR-011…FR-013, FR-015: the same numbers as the screen, in the order of the screen.
 * No company, vacancy or note names: only totals, stages and the period.
 */
export function buildShareCard(
  data: Pick<AnalyticsData, 'totals' | 'funnel' | 'searchDays'>,
  period: AnalyticsPeriod,
  t: Translate,
  language: string,
): ShareCard {
  const number = new Intl.NumberFormat(language)
  return {
    title: 'Findy',
    subtitle: t('analytics.share.subtitle'),
    period: t(`analytics.period.${period}`),
    tiles: [
      { label: t('analytics.totals.searchDays'), value: number.format(data.searchDays) },
      ...TILE_KEYS.map((key) => ({
        label: t(`analytics.totals.${key}`),
        value: number.format(data.totals[key]),
      })),
    ],
    funnelTitle: t('analytics.funnel.title'),
    funnel: data.funnel.map((step) => ({
      stage: step.stage,
      label: t(`stages.${step.stage}`),
      count: number.format(step.count),
      share: formatShare(step.share, language),
      ratio: step.share,
    })),
    site: SITE_URL.replace(/^https?:\/\//, '').replace(/\/$/, ''),
  }
}
