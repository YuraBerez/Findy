import { z } from 'zod'
import {
  ApplicationInputSchema,
  ApplicationPatchSchema,
  IdSchema,
  LanguageSchema,
  MoveTargetSchema,
  NoteTextSchema,
  ThemeSchema,
} from '../domain/schema'
import type { Theme } from '../domain/types'
import type { AppInfo, AppState, IpcErrorPayload, IpcMethod, IpcResult } from '../shared/ipc'
import { NotFoundError, type Repository } from './db/repository'
import { isSafeExternalUrl } from './security'

export interface IpcDeps {
  /** `null` when the database could not be opened (storage.status === 'error'). */
  repository: Repository | null
  storage: AppState['storage']
  appVersion: string
  getSystemLocale(): string
  openExternal(url: string): Promise<void>
  applyTheme(theme: Theme): void
  /** Saves a copy of the database before a destructive action (FR-092) */
  backup(label: string): void
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

  const state = (): AppState => ({
    settings: deps.repository?.getSettings() ?? { language: null, theme: 'system' },
    applications: deps.repository?.listApplications() ?? [],
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
      return state()
    }),
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
  if (error instanceof NotFoundError) {
    return { code: 'NOT_FOUND', message: error.message }
  }
  return { code: 'STORAGE', message: error instanceof Error ? error.message : String(error) }
}
