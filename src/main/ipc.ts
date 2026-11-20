import { z } from 'zod'
import { DEFAULT_ANALYTICS_VIEW } from '../domain/analytics'
import { STALE_DAYS } from '../domain/stale'
import {
  AnalyticsViewSchema,
  ApplicationInputSchema,
  ApplicationPatchSchema,
  CardColorSchema,
  HiddenStagesSchema,
  IdSchema,
  isHttpUrl,
  LanguageSchema,
  LIMITS,
  MoveTargetSchema,
  NoteTextSchema,
  StaleAfterDaysSchema,
  HiddenSitesSchema,
  SiteInputSchema,
  SiteQuerySchema,
  ThemeSchema,
} from '../domain/schema'
import type { Language, Theme } from '../domain/types'
import type { KnownSiteId } from '../domain/sites'
import type {
  AppInfo,
  AppState,
  IpcErrorPayload,
  IpcMethod,
  IpcResult,
  McpConnection,
  UpdateCheckResult,
  UpdateTrigger,
  VacancyData,
} from '../shared/ipc'
import { KNOWN_SITES, siteHost } from '../domain/sites'
import { HiddenStageError, NotFoundError, SiteLimitError, type Repository } from './db/repository'
import { isSafeExternalUrl } from './security'
import type { Transfer } from './transfer'
import { UpdateCheckError } from './updates'

export interface IpcDeps {
  /** `null` when the database could not be opened (storage.status === 'error'). */
  repository: Repository | null
  storage: AppState['storage']
  appVersion: string
  getSystemLocale(): string
  openExternal(url: string): Promise<void>
  applyTheme(theme: Theme): void
  /** Rebuilds the native menu in the new language (FR-044) */
  applyLanguage(language: Language): void
  /** Saves a copy of the database before a destructive action (FR-092) */
  backup(label: string): void
  /** Spec 004 FR-009: the command an MCP client runs */
  mcpConnection(): McpConnection
  /** Spec 008: CSV files; `null` when the database could not be opened */
  transfer: Transfer | null
  /** Spec 006: main/updates.ts#createUpdateChecker */
  checkForUpdates(trigger: UpdateTrigger): Promise<UpdateCheckResult | null>
  /** Spec 011: main/siteIcons.ts#createIconFetcher; `null` when the database could not be opened */
  siteIcons: { icons(): Record<string, string>; refresh(hosts: string[]): Promise<void> } | null
  /** Spec 009: main/vacancy.ts#readVacancyPage with a session without cookies */
  readVacancy(url: string): Promise<VacancyData | null>
}

type Handler = (...args: unknown[]) => Promise<IpcResult<unknown>>

class StorageUnavailableError extends Error {}

/**
 * IPC handlers, independent of Electron so they are unit-testable.
 * Every argument is parsed with zod before use (docs/security.md).
 */
export function createHandlers(deps: IpcDeps): Record<IpcMethod, Handler> {
  const repo = (): Repository => {
    if (!deps.repository) throw new StorageUnavailableError('Storage is not available')
    return deps.repository
  }

  const transfer = (): Transfer => {
    if (!deps.transfer) throw new StorageUnavailableError('Storage is not available')
    return deps.transfer
  }

  // FR-023: in the background; a failure only means no icon yet (the letter stays)
  const refreshIcons = (hosts: string[]) => {
    void deps.siteIcons?.refresh(hosts).catch(() => {})
  }

  const state = (): AppState => ({
    settings: deps.repository?.getSettings() ?? {
      language: null,
      theme: 'system',
      hiddenStages: [],
      mcpEnabled: false,
      analytics: DEFAULT_ANALYTICS_VIEW,
      autoUpdateCheck: false,
      staleAfterDays: STALE_DAYS.default,
      hiddenSites: [],
      siteQuery: '',
      offerQuestionAnswered: false,
    },
    applications: deps.repository?.listApplications() ?? [],
    sites: deps.repository?.listSites() ?? [],
    storage: deps.storage,
  })

  const handle =
    <S extends z.ZodTuple>(schema: S, run: (...args: z.output<S>) => unknown): Handler =>
    async (...args) => {
      try {
        const parsed = schema.parse(args) as z.output<S>
        return { ok: true, data: await run(...parsed) }
      } catch (error) {
        return { ok: false, error: toPayload(error) }
      }
    }

  const none = z.tuple([])

  return {
    getState: handle(none, state),
    createApplication: handle(z.tuple([ApplicationInputSchema]), (input) => {
      repo().createApplication(input)
      return state()
    }),
    updateApplication: handle(z.tuple([IdSchema, ApplicationPatchSchema]), (id, patch) => {
      repo().updateApplication(id, patch)
      return state()
    }),
    // Spec 007 D-1: not part of the patch, so the MCP update tool cannot set it
    setApplicationColor: handle(z.tuple([IdSchema, CardColorSchema]), (id, color) => {
      repo().setApplicationColor(id, color)
      return state()
    }),
    moveApplication: handle(z.tuple([IdSchema, MoveTargetSchema]), (id, target) => {
      repo().moveApplication(id, target)
      return state()
    }),
    deleteApplication: handle(z.tuple([IdSchema]), (id) => {
      repo().deleteApplication(id)
      return state()
    }),
    resetBoard: handle(none, () => {
      const repository = repo()
      deps.backup('reset') // a failed backup throws, and nothing is deleted
      repository.resetBoard()
      return state()
    }),
    exportCsv: handle(z.tuple([LanguageSchema]), (language) => transfer().exportCsv(language)),
    previewImport: handle(none, () => transfer().previewImport()),
    confirmImport: handle(z.tuple([z.string().min(1).max(100)]), (token) => {
      const added = transfer().confirmImport(token)
      return { state: state(), added }
    }),
    addNote: handle(z.tuple([IdSchema, NoteTextSchema]), (applicationId, text) => {
      repo().addNote(applicationId, text)
      return state()
    }),
    updateNote: handle(z.tuple([IdSchema, IdSchema, NoteTextSchema]), (appId, noteId, text) => {
      repo().updateNote(appId, noteId, text)
      return state()
    }),
    deleteNote: handle(z.tuple([IdSchema, IdSchema]), (applicationId, noteId) => {
      repo().deleteNote(applicationId, noteId)
      return state()
    }),
    setLanguage: handle(z.tuple([LanguageSchema]), (language) => {
      repo().setLanguage(language)
      deps.applyLanguage(language)
      return state()
    }),
    setHiddenStages: handle(z.tuple([HiddenStagesSchema]), (stages) => {
      repo().setHiddenStages(stages)
      return state()
    }),
    setAnalyticsView: handle(z.tuple([AnalyticsViewSchema]), (view) => {
      repo().setAnalyticsView(view)
      return state()
    }),
    checkForUpdates: handle(z.tuple([z.enum(['manual', 'auto'])]), (trigger) =>
      deps.checkForUpdates(trigger),
    ),
    readVacancy: handle(
      z.tuple([z.string().max(LIMITS.url).refine(isHttpUrl, { message: 'Only http(s) URLs' })]),
      (url) => deps.readVacancy(url),
    ),
    addSite: handle(z.tuple([SiteInputSchema]), (site) => {
      repo().addSite(site)
      refreshIcons([siteHost(site.url)])
      return state()
    }),
    updateSite: handle(z.tuple([IdSchema, SiteInputSchema]), (id, site) => {
      repo().updateSite(id, site)
      refreshIcons([siteHost(site.url)]) // FR-021: a new host gets its icon
      return state()
    }),
    deleteSite: handle(z.tuple([IdSchema]), (id) => {
      repo().deleteSite(id)
      return state()
    }),
    setHiddenSites: handle(z.tuple([HiddenSitesSchema]), (ids) => {
      repo().setHiddenSites(ids as KnownSiteId[])
      return state()
    }),
    setSiteQuery: handle(z.tuple([SiteQuerySchema]), (query) => {
      repo().setSiteQuery(query)
      return state()
    }),
    getSiteIcons: handle(none, () => deps.siteIcons?.icons() ?? {}),
    refreshSiteIcons: handle(none, () => {
      const sites = deps.repository?.listSites() ?? []
      refreshIcons(
        [...KNOWN_SITES.map((site) => site.jobsUrl), ...sites.map((site) => site.url)].map(
          siteHost,
        ),
      )
    }),
    setStaleAfterDays: handle(z.tuple([StaleAfterDaysSchema]), (days) => {
      repo().setStaleAfterDays(days)
      return state()
    }),
    answerOfferQuestion: handle(none, () => {
      repo().answerOfferQuestion()
      return state()
    }),
    setAutoUpdateCheck: handle(z.tuple([z.boolean()]), (enabled) => {
      repo().setAutoUpdateCheck(enabled)
      return state()
    }),
    setMcpEnabled: handle(z.tuple([z.boolean()]), (enabled) => {
      repo().setMcpEnabled(enabled)
      return state()
    }),
    getMcpConnection: handle(none, () => deps.mcpConnection()),
    setTheme: handle(z.tuple([ThemeSchema]), (theme) => {
      repo().setTheme(theme)
      deps.applyTheme(theme)
      return state()
    }),
    getSystemLocale: handle(none, () => deps.getSystemLocale()),
    openExternal: handle(
      z.tuple([z.string().refine(isSafeExternalUrl, { message: 'Only http(s) URLs' })]),
      async (url) => {
        await deps.openExternal(url)
      },
    ),
    getAppInfo: handle(none, (): AppInfo => ({
      version: deps.appVersion,
      dataFilePath: deps.storage.dataFilePath,
    })),
  }
}

function toPayload(error: unknown): IpcErrorPayload {
  if (error instanceof z.ZodError) {
    return { code: 'VALIDATION', message: z.prettifyError(error) }
  }
  if (error instanceof HiddenStageError || error instanceof SiteLimitError) {
    return { code: 'VALIDATION', message: error.message }
  }
  if (error instanceof UpdateCheckError) {
    return { code: 'NETWORK', message: error.message }
  }
  if (error instanceof NotFoundError) {
    return { code: 'NOT_FOUND', message: error.message }
  }
  return { code: 'STORAGE', message: error instanceof Error ? error.message : String(error) }
}
