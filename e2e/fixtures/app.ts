import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
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
import { FindyBackdoor } from '../data/findy-backdoor'
import { ApplicationDetailsScreen } from '../screens/application-details.screen'
import { ApplicationDialogScreen } from '../screens/application-dialog.screen'
import { BoardScreen } from '../screens/board.screen'
import { ElectronA11ySteps } from '../steps/a11y.steps'
import { ApplicationSteps } from '../steps/application.steps'

export { expect } from '@playwright/test'

export interface FindyPages {
  board: BoardScreen
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
  /** Close the app and start it again on the same database (US-6). Use the new pages. */
  restart(): Promise<FindyPages>
}

interface Options {
  /** Electron `--lang` switch; pins the UI language of a first launch (FR-041) */
  systemLocale: string
  /** Bytes written to findy.db before the first launch (US-6.3) */
  databaseFile: string | undefined
}

interface Fixtures extends Options {
  userDataDir: string
  electronApp: ElectronApplication
  errorGuard: ErrorGuard
  findy: Findy
}

async function launch(userDataDir: string, systemLocale: string): Promise<ElectronApplication> {
  const args = ['.', `--lang=${systemLocale}`]
  if (process.env.CI && process.platform === 'linux') args.push('--no-sandbox')
  return electron.launch({ args, env: { ...process.env, FINDY_USER_DATA_DIR: userDataDir } })
}

async function firstWindow(app: ElectronApplication): Promise<Page> {
  const page = await app.firstWindow()
  // Playwright emulates a light scheme by default; let nativeTheme drive it (FR-080)
  await page.emulateMedia({ colorScheme: null })
  await page.getByTestId('app').waitFor()
  return page
}

function pagesFor(page: Page): FindyPages {
  const board = new BoardScreen(page)
  const dialog = new ApplicationDialogScreen(page)
  return {
    board,
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

  userDataDir: async ({ databaseFile }, use) => {
    const dir = mkdtempSync(join(tmpdir(), 'findy-e2e-'))
    if (databaseFile !== undefined) writeFileSync(join(dir, 'findy.db'), databaseFile)
    await use(dir)
    rmSync(dir, { recursive: true, force: true })
  },

  electronApp: async ({ userDataDir, systemLocale }, use) => {
    const app = await launch(userDataDir, systemLocale)
    await use(app)
    await app.close().catch(() => {})
  },

  // The kit's error guard watches `context`: give it the Electron window's context
  context: async ({ electronApp }, use) => {
    await use(electronApp.context() as BrowserContext)
  },

  page: async ({ electronApp }, use) => {
    await use(await firstWindow(electronApp))
  },

  errorGuard: errorGuardFixture(),

  findy: async ({ electronApp, page, userDataDir, systemLocale, errorGuard }, use) => {
    let app = electronApp
    let window = page
    const findy: Findy = {
      pages: pagesFor(page),
      api: new FindyBackdoor(page, electronApp),
      refresh: async () => {
        await window.reload()
        await window.getByTestId('app').waitFor()
      },
      restart: async () => {
        await app.close()
        app = await launch(userDataDir, systemLocale)
        await errorGuard.watch(app.context())
        window = await firstWindow(app)
        findy.pages = pagesFor(window)
        findy.api = new FindyBackdoor(window, app)
        return findy.pages
      },
    }
    await use(findy)
    if (app !== electronApp) await app.close().catch(() => {})
  },
})
