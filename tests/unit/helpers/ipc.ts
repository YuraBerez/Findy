import { vi } from 'vitest'
import { createHandlers, type IpcDeps } from '../../../src/main/ipc'
import { createTransfer } from '../../../src/main/transfer'
import { type AppState, type IpcResult, unwrap } from '../../../src/shared/ipc'
import { memoryRepository } from './db'
import { fakeFiles } from './files'

// IPC handlers over an in-memory database, fake files and fake services (tests/unit/ipc/)

export const okStorage = { status: 'ok' as const, dataFilePath: '/data/findy.db' }

/** The settings of a new database */
export const DEFAULT_SETTINGS: AppState['settings'] = {
  language: null,
  theme: 'system',
  hiddenStages: [],
  mcpEnabled: false,
  analytics: { period: '30d', grouping: 'day' },
  autoUpdateCheck: false,
  staleAfterDays: 14,
  hiddenSites: [],
  siteQuery: '',
  offerQuestionAnswered: false,
  remindersEnabled: true,
}

export function setup(overrides: Partial<IpcDeps> = {}) {
  const { repository } = memoryRepository()
  const files = fakeFiles()
  const deps: IpcDeps = {
    repository,
    transfer: createTransfer({ repository, ...files.deps }),
    storage: okStorage,
    appVersion: '0.1.0',
    getSystemLocale: () => 'uk-UA',
    openExternal: vi.fn(async () => {}),
    applyTheme: vi.fn(),
    applyLanguage: vi.fn(),
    backup: vi.fn(),
    mcpConnection: () => ({
      command: '/Applications/Findy.app/Contents/MacOS/Findy',
      args: ['--mcp'],
      env: {},
    }),
    checkForUpdates: vi.fn(async () => ({ status: 'latest' as const, currentVersion: '0.1.0' })),
    readVacancy: vi.fn(async () => ({ title: 'Frontend Developer', company: 'Acme' })),
    saveSkill: vi.fn(async () => ({ status: 'saved' as const })),
    calendar: { save: vi.fn(async () => ({ status: 'saved' as const })) },
    image: { copy: vi.fn(async () => {}), save: vi.fn(async () => ({ status: 'saved' as const })) },
    siteIcons: {
      icons: vi.fn(() => ({ 'djinni.co': 'data:image/png;base64,AA==' })),
      refresh: vi.fn(async () => {}),
    },
    ...overrides,
  }
  return { deps, files, handlers: createHandlers(deps) }
}

export type IpcContext = ReturnType<typeof setup>

export const state = async (result: Promise<IpcResult<unknown>>) => unwrap(await result) as AppState
