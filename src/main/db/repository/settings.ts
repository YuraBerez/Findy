import { DEFAULT_ANALYTICS_VIEW, type AnalyticsView } from '../../../domain/analytics'
import { AnalyticsViewSchema, HiddenStagesSchema } from '../../../domain/schema'
import type { StageId } from '../../../domain/stages'
import { isKnownSiteId, SITE_LIMITS, type KnownSiteId } from '../../../domain/sites'
import { isStaleAfterDays, STALE_DAYS } from '../../../domain/stale'
import type { Language, Settings, Theme } from '../../../domain/types'
import { HiddenStageError } from './errors'
import type { StoreContext } from './rows'

/** The `settings` key-value table. An unknown or damaged value reads as the default. */
export class SettingsStore {
  constructor(private readonly ctx: StoreContext) {}

  get(): Settings {
    const rows = this.ctx.db.prepare('SELECT key, value FROM settings').all() as {
      key: string
      value: string
    }[]
    const map = new Map(rows.map((row) => [row.key, row.value]))
    const language = map.get('language')
    const theme = map.get('theme')
    return {
      language: language === 'en' || language === 'uk' ? language : null,
      theme: theme === 'light' || theme === 'dark' ? theme : 'system',
      hiddenStages: parseHiddenStages(map.get('hiddenStages')),
      mcpEnabled: map.get('mcpEnabled') === 'true',
      analytics: parseAnalyticsView(map.get('analytics')),
      autoUpdateCheck: map.get('autoUpdateCheck') === 'true',
      staleAfterDays: parseStaleAfterDays(map.get('staleAfterDays')),
      hiddenSites: parseHiddenSites(map.get('hiddenSites')),
      siteQuery: (map.get('siteQuery') ?? '').slice(0, SITE_LIMITS.query),
      offerQuestionAnswered: map.get('offerQuestionAnswered') === 'true',
      // Spec 015 FR-030: on by default; only an explicit 'false' turns them off
      remindersEnabled: map.get('remindersEnabled') !== 'false',
    }
  }

  setLanguage(language: Language): Settings {
    return this.set('language', language)
  }

  setTheme(theme: Theme): Settings {
    return this.set('theme', theme)
  }

  setMcpEnabled(enabled: boolean): Settings {
    return this.set('mcpEnabled', String(enabled))
  }

  setHiddenStages(stages: StageId[]): Settings {
    return this.set('hiddenStages', JSON.stringify(stages))
  }

  setAnalyticsView(view: AnalyticsView): Settings {
    return this.set('analytics', JSON.stringify(view))
  }

  setAutoUpdateCheck(enabled: boolean): Settings {
    return this.set('autoUpdateCheck', String(enabled))
  }

  /** Spec 011 FR-015 */
  setHiddenSites(ids: KnownSiteId[]): Settings {
    return this.set('hiddenSites', JSON.stringify([...new Set(ids)]))
  }

  /** Spec 011 FR-005 */
  setSiteQuery(query: string): Settings {
    return this.set('siteQuery', query)
  }

  setStaleAfterDays(days: number): Settings {
    return this.set('staleAfterDays', String(days))
  }

  /** Spec 015 FR-030 */
  setRemindersEnabled(enabled: boolean): Settings {
    return this.set('remindersEnabled', String(enabled))
  }

  /** Spec 013 FR-004 */
  answerOfferQuestion(): Settings {
    return this.set('offerQuestionAnswered', 'true')
  }

  /** Spec 006 FR-004: when the last update check ran; not part of Settings */
  getLastUpdateCheck(): string | null {
    const row = this.ctx.db
      .prepare("SELECT value FROM settings WHERE key = 'lastUpdateCheckAt'")
      .get() as { value: string } | undefined
    return row?.value ?? null
  }

  setLastUpdateCheck(at: string): void {
    this.set('lastUpdateCheckAt', at)
  }

  /** Spec 002 FR-006 */
  assertVisible(stage: StageId): void {
    if (this.get().hiddenStages.includes(stage)) throw new HiddenStageError(stage)
  }

  private set(key: string, value: string): Settings {
    this.ctx.db
      .prepare(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      )
      .run(key, value)
    return this.get()
  }
}

/** A damaged or invalid value means "nothing hidden", never a broken board. */
function parseHiddenStages(raw: string | undefined): StageId[] {
  if (!raw) return []
  try {
    const parsed = HiddenStagesSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : []
  } catch {
    return []
  }
}

/** A damaged or invalid value means the default view (spec 005 US-6.1). */
function parseAnalyticsView(raw: string | undefined): AnalyticsView {
  if (!raw) return DEFAULT_ANALYTICS_VIEW
  try {
    const parsed = AnalyticsViewSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : DEFAULT_ANALYTICS_VIEW
  } catch {
    return DEFAULT_ANALYTICS_VIEW
  }
}

/** Spec 010 FR-009: a missing or damaged value reads as the default */
function parseStaleAfterDays(value: string | undefined): number {
  const days = Number(value)
  return value !== undefined && isStaleAfterDays(days) ? days : STALE_DAYS.default
}

/** Spec 011: known site ids only; a site removed in a later version is dropped */
function parseHiddenSites(value: string | undefined): KnownSiteId[] {
  try {
    const parsed: unknown = JSON.parse(value ?? '[]')
    return Array.isArray(parsed) ? [...new Set(parsed.filter(isKnownSiteId))] : []
  } catch {
    return []
  }
}
