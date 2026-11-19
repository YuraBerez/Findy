import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  test as base,
  _electron as electron,
  type BrowserContext,
  type ElectronApplication,
  type Page,
} from '@playwright/test'
import { errorGuardFixture, type ErrorGuard } from 'playwright-e2e-kit'
import { writeBulkDatabase, type BulkData } from '../data/bulk-database'
import { CsvFiles } from '../data/csv-files'
import { FindyBackdoor } from '../data/findy-backdoor'
import { writeHistoryDatabase, type HistoryApplication } from '../data/history-database'
import { McpTestClient } from '../data/mcp-client'
import { ReleaseServer, type FakeRelease } from '../data/release-server'
import { VacancyServer } from '../data/vacancy-server'
import { ApplicationDetailsScreen } from '../screens/application-details.screen'
import { ApplicationDialogScreen } from '../screens/application-dialog.screen'
import { AnalyticsScreen } from '../screens/analytics.screen'
import { ImportDialogScreen } from '../screens/import-dialog.screen'
import { UpdatesScreen } from '../screens/updates.screen'
import { BoardScreen } from '../screens/board.screen'
import { mousePointer } from './pointer'
import { ElectronA11ySteps } from '../steps/a11y.steps'
import { ApplicationSteps } from '../steps/application.steps'

export { expect } from '@playwright/test'
export type { HistoryApplication } from '../data/history-database'

export interface FindyPages {
  board: BoardScreen
  analytics: AnalyticsScreen
  updates: UpdatesScreen
  importDialog: ImportDialogScreen
  dialog: ApplicationDialogScreen
  details: ApplicationDetailsScreen
  applications: ApplicationSteps
  a11y: ElectronA11ySteps
}

export interface Findy {
  pages: FindyPages
  /** Back door: seed data and read state through the IPC API */
  api: FindyBackdoor
  /** Reload the window, e.g. to show data seeded through the back door. */
  refresh(): Promise<void>
  /** File names in the app's data directory (database, backups) */
  dataFiles(): string[]
  /** Close the app and start it again on the same database (US-6). Use the new pages. */
  restart(): Promise<FindyPages>
  /** Start `Findy --mcp` on the same database and connect an MCP client (spec 004) */
  connectMcp(): Promise<McpTestClient>
  /** The fake release API, when the test sets `latestRelease` (spec 006) */
  releases: ReleaseServer | null
  /** CSV files for export and import (spec 008) */
  files: CsvFiles
}

interface Options {
  /** Electron `--lang` switch; pins the UI language of a first launch (FR-041) */
  systemLocale: string
  /** Bytes written to findy.db before the first launch (US-6.3) */
  databaseFile: string | undefined
  /** Many applications and notes written to findy.db before the first launch (NFR-002) */
  bulkData: BulkData | undefined
  /**
   * Applications with a past stage history, written before the first launch (spec 005).
   * An object, because Playwright reads an array option as `[value, options]`.
   */
  history: { applications: HistoryApplication[] } | undefined
  /** Serve this as the latest release through a local server (spec 006, plan D-4) */
  latestRelease: FakeRelease | undefined
}

interface Fixtures extends Options {
  userDataDir: string
  releaseServer: ReleaseServer | null
  /** Spec 009: local vacancy pages; started only by the tests that use it */
  vacancyPages: VacancyServer
  electronApp: ElectronApplication
  errorGuard: ErrorGuard
  findy: Findy
}

async function launch(
  userDataDir: string,
  systemLocale: string,
  releases: ReleaseServer | null,
): Promise<ElectronApplication> {
  const args = ['.', `--lang=${systemLocale}`]
  if (process.env.CI && process.platform === 'linux') args.push('--no-sandbox')
  const env: Record<string, string> = { ...process.env, FINDY_USER_DATA_DIR: userDataDir }
  // Never reach the real GitHub from a test: without a fake server, point at a closed port
  env.FINDY_RELEASES_URL = releases?.url ?? 'http://127.0.0.1:9/latest'
  return electron.launch({ args, env })
}

/**
 * Closes the app; kills it if it does not exit in time. On a busy CI runner (Windows)
 * `close()` hung until the test timed out, and later tests failed in a row (issue #23).
 */
async function closeApp(app: ElectronApplication): Promise<void> {
  const closed = app.close().then(
    () => true,
    () => false,
  )
  let timer: NodeJS.Timeout | undefined
  const timeout = new Promise<false>((resolve) => (timer = setTimeout(resolve, 10_000, false)))
  const ok = await Promise.race([closed, timeout])
  clearTimeout(timer)
  if (ok) return
  const child = app.process()
  if (child.exitCode !== null || child.signalCode !== null) return
  const exited = new Promise((resolve) => child.once('exit', resolve))
  child.kill()
  await exited // the next launch needs the single-instance lock and the database
}

async function firstWindow(app: ElectronApplication): Promise<Page> {
  const page = await app.firstWindow()
  // Only Playwright's input reaches the window. The real cursor of the OS can be over it
  // (on CI it rests in the middle of the screen), and its moves came in during a drag:
  // the card jumped to another column and back (issue #23)
  await app.evaluate(({ BrowserWindow }) => {
    for (const win of BrowserWindow.getAllWindows()) win.setIgnoreMouseEvents(true)
  })
  // Playwright emulates a light scheme by default; let nativeTheme drive it (FR-080)
  await page.emulateMedia({ colorScheme: null })
  await page.getByTestId('app').waitFor()
  return page
}

function pagesFor(page: Page): FindyPages {
  const board = new BoardScreen(page, mousePointer(page))
  const dialog = new ApplicationDialogScreen(page)
  return {
    board,
    analytics: new AnalyticsScreen(page),
    updates: new UpdatesScreen(page),
    importDialog: new ImportDialogScreen(page),
    dialog,
    details: new ApplicationDetailsScreen(page),
    applications: new ApplicationSteps({ board, dialog }),
    a11y: new ElectronA11ySteps(page),
  }
}

/** Electron variant of the kit fixtures: one isolated app and database per test. */
export const test = base.extend<Fixtures>({
  systemLocale: ['en-US', { option: true }],
  databaseFile: [undefined, { option: true }],
  bulkData: [undefined, { option: true }],
  history: [undefined, { option: true }],
  latestRelease: [undefined, { option: true }],

  releaseServer: async ({ latestRelease }, use) => {
    const server = latestRelease ? await ReleaseServer.start(latestRelease) : null
    await use(server)
    await server?.close()
  },

  // eslint-disable-next-line no-empty-pattern -- Playwright needs the destructuring
  vacancyPages: async ({}, use) => {
    const server = await VacancyServer.start()
    await use(server)
    await server.close()
  },

  userDataDir: async ({ databaseFile, bulkData, history }, use) => {
    const dir = mkdtempSync(join(tmpdir(), 'findy-e2e-'))
    if (databaseFile !== undefined) writeFileSync(join(dir, 'findy.db'), databaseFile)
    if (bulkData) writeBulkDatabase(join(dir, 'findy.db'), bulkData)
    if (history) writeHistoryDatabase(join(dir, 'findy.db'), history.applications)
    await use(dir)
    // Windows keeps files locked for a moment after a child process exits
    rmSync(dir, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 })
  },

  electronApp: async ({ userDataDir, systemLocale, releaseServer }, use) => {
    const app = await launch(userDataDir, systemLocale, releaseServer)
    await use(app)
    await closeApp(app)
  },

  // The kit's error guard watches `context`: give it the Electron window's context
  context: async ({ electronApp }, use) => {
    await use(electronApp.context() as BrowserContext)
  },

  page: async ({ electronApp }, use) => {
    await use(await firstWindow(electronApp))
  },

  errorGuard: errorGuardFixture(),

  findy: async (
    { electronApp, page, userDataDir, systemLocale, errorGuard, releaseServer },
    use,
  ) => {
    let app = electronApp
    let window = page
    const mcpClients: McpTestClient[] = []
    const findy: Findy = {
      pages: pagesFor(page),
      api: new FindyBackdoor(page, electronApp),
      dataFiles: () => readdirSync(userDataDir),
      releases: releaseServer,
      files: new CsvFiles(userDataDir),
      connectMcp: async () => {
        const client = await McpTestClient.start(await findy.api.mcpConnection(), userDataDir)
        mcpClients.push(client)
        return client
      },
      refresh: async () => {
        await window.reload()
        await window.getByTestId('app').waitFor()
      },
      restart: async () => {
        await closeApp(app)
        app = await launch(userDataDir, systemLocale, releaseServer)
        await errorGuard.watch(app.context())
        window = await firstWindow(app)
        findy.pages = pagesFor(window)
        findy.api = new FindyBackdoor(window, app)
        return findy.pages
      },
    }
    await use(findy)
    for (const client of mcpClients) await client.close().catch(() => {})
    if (app !== electronApp) await closeApp(app)
  },
})
