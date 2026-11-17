// Renderer ↔ main contract: docs/contracts/ipc.md
import type { StageId } from '../domain/stages'
import type { Application, Language, Note, Settings, Theme } from '../domain/types'

export type { Application, Language, Note, Settings, StageId, Theme }

export const CHANNEL_PREFIX = 'findy:'

export const IPC_METHODS = [
  'getState',
  'createApplication',
  'updateApplication',
  'moveApplication',
  'deleteApplication',
  'addNote',
  'updateNote',
  'deleteNote',
  'setLanguage',
  'setTheme',
  'getSystemLocale',
  'openExternal',
  'getAppInfo',
] as const

export type IpcMethod = (typeof IPC_METHODS)[number]

export const IPC_EVENTS = ['languageChanged', 'storageError'] as const
export type IpcEvent = (typeof IPC_EVENTS)[number]

export type IpcErrorCode = 'VALIDATION' | 'NOT_FOUND' | 'STORAGE'

export interface IpcErrorPayload {
  code: IpcErrorCode
  message: string
}

/** Every handler resolves with an envelope, so error codes survive the IPC boundary. */
export type IpcResult<T> = { ok: true; data: T } | { ok: false; error: IpcErrorPayload }

const ERROR_CODES: readonly IpcErrorCode[] = ['VALIDATION', 'NOT_FOUND', 'STORAGE']

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
  storage: StorageStatus
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
  moveApplication(id: string, to: { stage: StageId; index: number }): Promise<AppState>
  deleteApplication(id: string): Promise<AppState>
  addNote(applicationId: string, text: string): Promise<AppState>
  updateNote(applicationId: string, noteId: string, text: string): Promise<AppState>
  deleteNote(applicationId: string, noteId: string): Promise<AppState>
  setLanguage(language: Language): Promise<AppState>
  setTheme(theme: Theme): Promise<AppState>
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
