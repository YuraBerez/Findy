import { DEFAULT_ANALYTICS_VIEW, type AnalyticsView } from '../../../domain/analytics'
import { AnalyticsViewSchema, HiddenStagesSchema } from '../../../domain/schema'
import type { StageId } from '../../../domain/stages'
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

  setStaleAfterDays(days: number): Settings {
    return this.set('staleAfterDays', String(days))
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
