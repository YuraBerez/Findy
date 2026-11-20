// Renderer ↔ main contract: docs/contracts/ipc.md
import type { AnalyticsGrouping, AnalyticsPeriod, AnalyticsView } from '../domain/analytics'
import type { CardColor } from '../domain/colors'
import type { StageId } from '../domain/stages'
import type { ImportFatal, ImportRowError } from '../domain/transfer'
import type { VacancyData } from '../domain/vacancy'
import type { CustomSite, KnownSiteId } from '../domain/sites'
import type { Application, Language, Note, Settings, StageChange, Theme } from '../domain/types'

export type { AnalyticsGrouping, AnalyticsPeriod, AnalyticsView, CardColor }
export type { ImportFatal, ImportRowError }
export type { VacancyData }
export type { CustomSite, KnownSiteId }
export type { Application, Language, Note, Settings, StageChange, StageId, Theme }

export const CHANNEL_PREFIX = 'findy:'

export const IPC_METHODS = [
  'getState',
  'createApplication',
  'updateApplication',
  'setApplicationColor',
  'moveApplication',
  'deleteApplication',
  'resetBoard',
  'exportCsv',
  'previewImport',
  'confirmImport',
  'addNote',
  'updateNote',
  'deleteNote',
  'setLanguage',
  'setTheme',
  'setHiddenStages',
  'setAnalyticsView',
  'setAutoUpdateCheck',
  'setStaleAfterDays',
  'answerOfferQuestion',
  'checkForUpdates',
  'readVacancy',
  'addSite',
  'updateSite',
  'deleteSite',
  'setHiddenSites',
  'setSiteQuery',
  'getSiteIcons',
  'refreshSiteIcons',
  'setMcpEnabled',
  'getMcpConnection',
  'getSystemLocale',
  'openExternal',
  'getAppInfo',
] as const

export type IpcMethod = (typeof IPC_METHODS)[number]

export const IPC_EVENTS = [
  'languageChanged',
  'storageError',
  'stateChanged',
  /** Spec 011: a site icon was saved; ask getSiteIcons again */
  'siteIconsChanged',
] as const
export type IpcEvent = (typeof IPC_EVENTS)[number]

export type IpcErrorCode = 'VALIDATION' | 'NOT_FOUND' | 'STORAGE' | 'NETWORK'

export interface IpcErrorPayload {
  code: IpcErrorCode
  message: string
}

/** Every handler resolves with an envelope, so error codes survive the IPC boundary. */
export type IpcResult<T> = { ok: true; data: T } | { ok: false; error: IpcErrorPayload }

const ERROR_CODES: readonly IpcErrorCode[] = ['VALIDATION', 'NOT_FOUND', 'STORAGE', 'NETWORK']

/**
 * contextBridge passes only the message of an Error to the renderer, so the code is
 * also the message prefix ("VALIDATION: …"). Read it with `getIpcErrorCode`.
 */
export class IpcError extends Error {
  readonly code: IpcErrorCode

  constructor({ code, message }: IpcErrorPayload) {
    super(`${code}: ${message}`)
    this.name = 'IpcError'
    this.code = code
  }
}

export type ErrorKind = 'validation' | 'notFound' | 'storage' | 'network' | 'unknown'

/** Spec 003 FR-002: what kind of message the user needs for this failure. */
export function errorKind(error: unknown): ErrorKind {
  switch (getIpcErrorCode(error)) {
    case 'VALIDATION':
      return 'validation'
    case 'NOT_FOUND':
      return 'notFound'
    case 'STORAGE':
      return 'storage'
    case 'NETWORK':
      return 'network'
    default:
      return 'unknown'
  }
}

export function getIpcErrorCode(error: unknown): IpcErrorCode | null {
  const message = error instanceof Error ? error.message : String(error)
  // Electron prefixes rejected invoke() messages; search instead of anchoring
  return ERROR_CODES.find((code) => message.includes(`${code}: `)) ?? null
}

export type StorageStatus =
  | { status: 'ok'; dataFilePath: string }
  | {
      status: 'error'
      error: 'corrupt' | 'newer_version' | 'open_failed'
      dataFilePath: string
      backupPath: string | null
    }

export interface AppState {
  settings: Settings
  applications: Application[]
  /** Spec 011: the user's job sites, in the order they were added */
  sites: CustomSite[]
  storage: StorageStatus
}

export interface McpConnection {
  command: string
  args: string[]
  /** Environment for the command, e.g. ELECTRON_RUN_AS_NODE=1 */
  env: Record<string, string>
}

/** Spec 006: who started the check */
export type UpdateTrigger = 'manual' | 'auto'

export type UpdateCheckResult =
  | { status: 'available'; version: string; currentVersion: string; url: string }
  | { status: 'latest'; currentVersion: string }

/** Spec 008 */
export type ExportResult = { status: 'saved'; count: number } | { status: 'cancelled' }

/** Spec 008 FR-020: what an import would do; nothing has changed yet */
export interface ImportPreview {
  /** Pass to confirmImport; null when there is nothing to add */
  token: string | null
  /** The base name of the picked file, never its path (FR-031) */
  fileName: string
  fatal: ImportFatal | null
  toAdd: number
  duplicates: number
  hidden: number
  /** Every row error; the dialog shows the first 20 */
  errors: ImportRowError[]
}

export interface AppInfo {
  version: string
  dataFilePath: string
}

export interface NewApplication {
  title: string
  company: string
  url?: string | null
  stage?: StageId
}

export interface ApplicationChanges {
  title?: string
  company?: string
  url?: string | null
}

export interface FindyApi {
  getState(): Promise<AppState>
  createApplication(input: NewApplication): Promise<AppState>
  updateApplication(id: string, patch: ApplicationChanges): Promise<AppState>
  /** Spec 007: a palette colour, or null for none */
  setApplicationColor(id: string, color: CardColor | null): Promise<AppState>
  moveApplication(id: string, to: { stage: StageId; index: number }): Promise<AppState>
  deleteApplication(id: string): Promise<AppState>
  /** FR-090…093: backup, then delete all applications */
  resetBoard(): Promise<AppState>
  /** Spec 008: save dialog, then the whole board as CSV in this language */
  exportCsv(language: Language): Promise<ExportResult>
  /** Spec 008: open dialog, then a summary; null when the user cancels the dialog */
  previewImport(): Promise<ImportPreview | null>
  /** Spec 008: adds the previewed rows; NOT_FOUND for an old token */
  confirmImport(token: string): Promise<{ state: AppState; added: number }>
  addNote(applicationId: string, text: string): Promise<AppState>
  updateNote(applicationId: string, noteId: string, text: string): Promise<AppState>
  deleteNote(applicationId: string, noteId: string): Promise<AppState>
  setLanguage(language: Language): Promise<AppState>
  setTheme(theme: Theme): Promise<AppState>
  /** Spec 002: columns hidden on the board */
  setHiddenStages(stages: StageId[]): Promise<AppState>
  /** Spec 005: period and grouping of the analytics screen */
  setAnalyticsView(view: AnalyticsView): Promise<AppState>
  /**
   * Spec 006: `manual` always checks and rejects with NETWORK on failure; `auto` resolves
   * to null when the automatic check is off, not due, or failed.
   */
  checkForUpdates(trigger: UpdateTrigger): Promise<UpdateCheckResult | null>
  /**
   * Spec 009: job title and company of a pasted vacancy page; null when the page cannot
   * be read or has neither (never rejects for that). VALIDATION for a non-http(s) link.
   */
  readVacancy(url: string): Promise<VacancyData | null>
  /** Spec 010 FR-008: days after which an application is stale; VALIDATION unless 3–90 */
  setStaleAfterDays(days: number): Promise<AppState>
  /** Spec 013 FR-004: the offer question is answered; it is never asked again */
  answerOfferQuestion(): Promise<AppState>
  /** Spec 011 FR-010: VALIDATION for a bad name or address, or after 50 sites */
  addSite(site: { name: string; url: string }): Promise<AppState>
  /** Spec 011 FR-011: NOT_FOUND for an unknown id */
  updateSite(id: string, site: { name: string; url: string }): Promise<AppState>
  deleteSite(id: string): Promise<AppState>
  /** Spec 011 FR-015 */
  setHiddenSites(ids: KnownSiteId[]): Promise<AppState>
  /** Spec 011 FR-005: trimmed, ≤ 200 characters */
  setSiteQuery(query: string): Promise<AppState>
  /** Spec 011 FR-020: host → `data:` URL of each saved icon */
  getSiteIcons(): Promise<Record<string, string>>
  /** Spec 011 FR-021: downloads the missing icons in the background; `siteIconsChanged` follows */
  refreshSiteIcons(): Promise<void>
  /** Spec 006 FR-002: check for updates at start */
  setAutoUpdateCheck(enabled: boolean): Promise<AppState>
  /** Spec 004: allow AI assistants (MCP) to use the board */
  setMcpEnabled(enabled: boolean): Promise<AppState>
  /** Spec 004 FR-009: how an MCP client starts Findy's server */
  getMcpConnection(): Promise<McpConnection>
  getSystemLocale(): Promise<string>
  openExternal(url: string): Promise<void>
  getAppInfo(): Promise<AppInfo>
  on(event: IpcEvent, handler: (payload: unknown) => void): () => void
}

export function unwrap<T>(result: IpcResult<T>): T {
  if (result.ok) return result.data
  throw new IpcError(result.error)
}

declare global {
  interface Window {
    findy: FindyApi
  }
}
