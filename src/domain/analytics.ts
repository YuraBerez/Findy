// Spec 005: numbers for the analytics screen, from the data the board already has
import { STAGES, visibleStages, type StageId } from './stages'
import type { Application } from './types'

export const ANALYTICS_PERIODS = ['7d', '30d', '90d', 'all'] as const
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number]

export const ANALYTICS_GROUPINGS = ['day', 'week', 'month'] as const
export type AnalyticsGrouping = (typeof ANALYTICS_GROUPINGS)[number]

export interface AnalyticsView {
  period: AnalyticsPeriod
  grouping: AnalyticsGrouping
}

/** US-6.1 */
export const DEFAULT_ANALYTICS_VIEW: AnalyticsView = { period: '30d', grouping: 'day' }

const PERIOD_DAYS: Record<Exclude<AnalyticsPeriod, 'all'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

/** FR-022: funnel steps in board order; "Rejected" is a separate number (FR-023). */
export const FUNNEL_STAGES: readonly StageId[] = STAGES.filter((stage) => stage !== 'rejected')

/** FR-024: stages that count as an interview */
export const INTERVIEW_STAGES: readonly StageId[] = [
  'hr_interview',
  'technical_interview',
  'c_level_interview',
]

export function isAnalyticsPeriod(value: unknown): value is AnalyticsPeriod {
  return (ANALYTICS_PERIODS as readonly unknown[]).includes(value)
}

export function isAnalyticsGrouping(value: unknown): value is AnalyticsGrouping {
  return (ANALYTICS_GROUPINGS as readonly unknown[]).includes(value)
}

// ── Calendar (FR-012: local time, weeks start on Monday) ──────────────────

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** The first day of the bucket that contains `date`. */
export function bucketStart(date: Date, grouping: AnalyticsGrouping): Date {
  const day = startOfDay(date)
  if (grouping === 'day') return day
  if (grouping === 'week') {
    const sinceMonday = (day.getDay() + 6) % 7
    return new Date(day.getFullYear(), day.getMonth(), day.getDate() - sinceMonday)
  }
  return new Date(day.getFullYear(), day.getMonth(), 1)
}

function nextBucket(start: Date, grouping: AnalyticsGrouping): Date {
  const [y, m, d] = [start.getFullYear(), start.getMonth(), start.getDate()]
  if (grouping === 'day') return new Date(y, m, d + 1)
  if (grouping === 'week') return new Date(y, m, d + 7)
  return new Date(y, m + 1, 1)
}

/** Local date as `YYYY-MM-DD`; the key of a bucket is the key of its first day. */
export function dateKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export interface DateRange {
  /** First day, local midnight */
  start: Date
  /** The day after the last day, local midnight (exclusive) */
  end: Date
}

/** FR-013: "Last N days" ends today; "All time" starts on the day of the oldest application. */
export function periodRange(
  period: AnalyticsPeriod,
  now: Date,
  applications: readonly Application[],
): DateRange {
  const today = startOfDay(now)
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  if (period !== 'all') {
    const days = PERIOD_DAYS[period]
    return { start: new Date(end.getFullYear(), end.getMonth(), end.getDate() - days), end }
  }
  const oldest = applications.reduce<number>(
    (min, application) => Math.min(min, Date.parse(application.createdAt)),
    today.getTime(),
  )
  return { start: startOfDay(new Date(oldest)), end }
}

/**
 * Spec 022 FR-002: calendar days from the creation day of the oldest application to
 * today, both days included; at least 1. 0 when there are no applications (FR-006).
 */
export function searchDays(applications: readonly Application[], now: Date): number {
  if (applications.length === 0) return 0
  const oldest = startOfDay(
    new Date(
      applications.reduce<number>(
        (min, application) => Math.min(min, Date.parse(application.createdAt)),
        Infinity,
      ),
    ),
  )
  const today = startOfDay(now)
  // UTC dates, so a daylight saving change does not give a part of a day
  const day = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.max(1, Math.round((day(today) - day(oldest)) / 86_400_000) + 1)
}

export interface Bucket {
  key: string
  start: Date
}

/** FR-020: every bucket of the range, also the empty ones. */
export function buckets(range: DateRange, grouping: AnalyticsGrouping): Bucket[] {
  const list: Bucket[] = []
  for (
    let start = bucketStart(range.start, grouping);
    start < range.end;
    start = nextBucket(start, grouping)
  ) {
    list.push({ key: dateKey(start), start })
  }
  return list
}

// ── Numbers ────────────────────────────────────────────────────────────────

export interface StageSeries {
  stage: StageId
  values: number[]
}

export interface FunnelStep {
  stage: StageId
  count: number
  /** Part of the first step, 0…1 */
  share: number
}

export interface AnalyticsTotals {
  applications: number
  interviews: number
  offers: number
  rejections: number
}

export interface AnalyticsData {
  range: DateRange
  buckets: Bucket[]
  /** FR-020: applications created per bucket */
  activity: number[]
  /** FR-021: stage entries per bucket, for the visible stages in board order */
  stages: StageSeries[]
  /** FR-022 */
  funnel: FunnelStep[]
  /** FR-023: applications of the period that were rejected */
  rejected: number
  totals: AnalyticsTotals
  /** FR-041: nothing happened in the period */
  noActivity: boolean
  /** Spec 022: days since the first application, not limited by the period */
  searchDays: number
}

export interface AnalyticsInput {
  applications: readonly Application[]
  hiddenStages: readonly StageId[]
  view: AnalyticsView
  now: Date
}

/** Everything the analytics screen shows, in one pass over the data (NFR-003). */
export function analytics({
  applications,
  hiddenStages,
  view,
  now,
}: AnalyticsInput): AnalyticsData {
  const range = periodRange(view.period, now, applications)
  const list = buckets(range, view.grouping)
  const index = new Map(list.map((bucket, i) => [bucket.key, i]))
  // FR-015: hidden stages do not show in the stages chart and the funnel
  const shown = visibleStages(hiddenStages)
  const funnelStages = FUNNEL_STAGES.filter((stage) => shown.includes(stage))

  const activity = list.map(() => 0)
  const perStage = new Map(STAGES.map((stage) => [stage, list.map(() => 0)]))
  const reached = FUNNEL_STAGES.map(() => 0)
  const totals: AnalyticsTotals = { applications: 0, interviews: 0, offers: 0, rejections: 0 }
  let rejected = 0
  let entries = 0

  // FR-010, FR-011: the bucket of a time stamp, or -1 outside the period
  const bucketOf = (iso: string): number => {
    const date = new Date(iso)
    if (date < range.start || date >= range.end) return -1
    return index.get(dateKey(bucketStart(date, view.grouping))) ?? -1
  }

  for (const application of applications) {
    const created = bucketOf(application.createdAt)
    if (created >= 0) {
      activity[created]!++
      totals.applications++
      // FR-023: every application reached "Applied"; the furthest step counts for all before it
      const furthest = Math.max(
        0,
        ...application.stageHistory.map((change) => FUNNEL_STAGES.indexOf(change.stage)),
      )
      for (let step = 0; step <= furthest; step++) reached[step]!++
      if (application.stageHistory.some((change) => change.stage === 'rejected')) rejected++
    }
    for (const change of application.stageHistory) {
      const bucket = bucketOf(change.at)
      if (bucket < 0) continue
      perStage.get(change.stage)![bucket]!++
      entries++
      if (INTERVIEW_STAGES.includes(change.stage)) totals.interviews++
      else if (change.stage === 'offered') totals.offers++
      else if (change.stage === 'rejected') totals.rejections++
    }
  }

  const steps = funnelStages.map((stage) => ({
    stage,
    count: reached[FUNNEL_STAGES.indexOf(stage)]!,
  }))
  const base = steps[0]?.count ?? 0
  const stages = shown.map((stage) => ({ stage, values: perStage.get(stage)! }))

  return {
    range,
    buckets: list,
    activity,
    stages,
    funnel: steps.map((step) => ({ ...step, share: base ? step.count / base : 0 })),
    rejected,
    totals,
    noActivity: totals.applications === 0 && entries === 0,
    searchDays: searchDays(applications, now),
  }
}
