import type { ElectronApplication, Page } from '@playwright/test'
import { withClipboardLock } from './clipboard-lock'
import type {
  AnalyticsView,
  ApplicationFieldChanges,
  AppState,
  CardColor,
  Language,
  McpConnection,
  NewApplication,
  NextStepChange,
  StageId,
  Theme,
} from '../../src/shared/ipc'

export interface SeedApplication {
  title: string
  company?: string
  url?: string | null
  stage?: StageId
  /** Spec 014 */
  fields?: ApplicationFieldChanges
  /** Spec 015 */
  nextStep?: NextStepChange['nextStep']
}

/** Spec 015: a system notification that main showed */
export interface ShownNotification {
  title: string
  body: string
}

/**
 * Back door into the app for test data and checks that the UI cannot show:
 * it calls the same `window.findy` IPC API that the renderer uses.
 */
export class FindyBackdoor {
  constructor(
    private readonly page: Page,
    private readonly app: ElectronApplication,
  ) {}

  /**
   * Spec 009: `paste` runs with `text` on the system clipboard. Workers take turns, and
   * the clipboard gets its old text back, so a local run does not lose what you copied.
   */
  async withClipboard(text: string, paste: () => Promise<void>): Promise<void> {
    await withClipboardLock(async () => {
      const previous = await this.app.evaluate(({ clipboard }) => clipboard.readText())
      await this.app.evaluate(({ clipboard }, value) => clipboard.writeText(value), text)
      try {
        await paste()
      } finally {
        await this.app.evaluate(({ clipboard }, value) => clipboard.writeText(value), previous)
      }
    })
  }

  /** The system clipboard text; read it inside `withClipboard` (spec 017) */
  clipboardText(): Promise<string> {
    return this.app.evaluate(({ clipboard }) => clipboard.readText())
  }

  /** Replaces shell.openExternal in main, so a test can see links without a browser. */
  async captureExternalLinks(): Promise<void> {
    await this.app.evaluate(({ shell }) => {
      const store = globalThis as { openedLinks?: string[] }
      store.openedLinks = []
      shell.openExternal = async (url: string) => {
        store.openedLinks!.push(url)
      }
    })
  }

  /**
   * Spec 008: the system save and open dialogs answer with this path (null = Cancel),
   * so a test never waits for a native dialog. Call again after a restart.
   */
  async answerFileDialogs(path: string | null): Promise<void> {
    await this.app.evaluate(({ dialog }, file) => {
      dialog.showSaveDialog = (async () =>
        file === null
          ? { canceled: true, filePath: '' }
          : { canceled: false, filePath: file }) as typeof dialog.showSaveDialog
      dialog.showOpenDialog = (async () =>
        file === null
          ? { canceled: true, filePaths: [] }
          : { canceled: false, filePaths: [file] }) as typeof dialog.showOpenDialog
    }, path)
  }

  /**
   * Spec 015: main records its system notifications instead of showing them, also where
   * the system has none (a CI runner). `clickNotification` clicks a recorded one.
   */
  async recordNotifications(): Promise<void> {
    await this.app.evaluate(({ Notification }) => {
      const store = globalThis as { shownNotifications?: Electron.Notification[] }
      store.shownNotifications = []
      Notification.isSupported = () => true
      Notification.prototype.show = function (this: Electron.Notification) {
        store.shownNotifications!.push(this)
      }
    })
  }

  notifications(): Promise<ShownNotification[]> {
    return this.app.evaluate(() =>
      (
        (globalThis as { shownNotifications?: Electron.Notification[] }).shownNotifications ?? []
      ).map(({ title, body }) => ({ title, body })),
    )
  }

  async clickNotification(index: number): Promise<void> {
    await this.app.evaluate((_electron, at) => {
      const store = globalThis as { shownNotifications?: Electron.Notification[] }
      store.shownNotifications![at]!.emit('click')
    }, index)
  }

  /** Spec 015 */
  async setNextStep(title: string, nextStep: NextStepChange['nextStep']): Promise<void> {
    await this.page.evaluate(
      async ({ title, nextStep }) => {
        const state = await window.findy.getState()
        const application = state.applications.find((item) => item.title === title)
        if (!application) throw new Error(`No application "${title}"`)
        await window.findy.updateApplication(application.id, { nextStep })
      },
      { title, nextStep },
    )
  }

  async setRemindersEnabled(enabled: boolean): Promise<void> {
    await this.page.evaluate((value) => window.findy.setRemindersEnabled(value), enabled)
  }

  /** Deletes behind the UI's back, e.g. to simulate another window (spec 003 US-1.3) */
  async deleteApplication(title: string): Promise<void> {
    await this.page.evaluate(async (value) => {
      const state = await window.findy.getState()
      await window.findy.deleteApplication(
        state.applications.find((item) => item.title === value)!.id,
      )
    }, title)
  }

  /** Makes every later call of one IPC method fail in main with this code (spec 003). */
  async failInMain(method: string, code: 'STORAGE' | 'NOT_FOUND' | 'VALIDATION'): Promise<void> {
    await this.app.evaluate(
      ({ ipcMain }, { method, code }) => {
        ipcMain.removeHandler(`findy:${method}`)
        ipcMain.handle(`findy:${method}`, () => ({
          ok: false,
          error: { code, message: 'simulated' },
        }))
      },
      { method, code },
    )
  }

  /** A promise rejection that no code handles (spec 003 FR-005) */
  async rejectUnhandled(message: string): Promise<void> {
    await this.page.evaluate((text) => {
      void Promise.reject(new Error(text))
    }, message)
  }

  /** Spec 018 FR-002: clicks an item of the native menu by its label, as its accelerator does */
  async clickNativeMenuItem(label: string): Promise<void> {
    await this.app.evaluate(({ Menu, BrowserWindow }, name) => {
      const find = (items: Electron.MenuItem[]): Electron.MenuItem | undefined => {
        for (const item of items) {
          if (item.label === name) return item
          const inner = item.submenu && find(item.submenu.items)
          if (inner) return inner
        }
        return undefined
      }
      const item = find(Menu.getApplicationMenu()?.items ?? [])
      if (!item) throw new Error(`No menu item "${name}"`)
      item.click(undefined, BrowserWindow.getAllWindows()[0])
    }, label)
  }

  /** Top-level labels of the native application menu (FR-044) */
  menuLabels(): Promise<string[]> {
    return this.app.evaluate(
      ({ Menu }) => Menu.getApplicationMenu()?.items.map((item) => item.label) ?? [],
    )
  }

  openedLinks(): Promise<string[]> {
    return this.app.evaluate(() => (globalThis as { openedLinks?: string[] }).openedLinks ?? [])
  }

  /** Creates applications so that the first item ends on top of its column (FR-023). */
  async seed(items: SeedApplication[]): Promise<void> {
    await this.page.evaluate(async (list) => {
      for (const item of [...list].reverse()) {
        await window.findy.createApplication({
          title: item.title,
          company: item.company ?? 'Acme',
          url: item.url ?? null,
          stage: item.stage,
          ...item.fields,
          nextStep: item.nextStep,
        })
      }
    }, items)
  }

  async addNote(title: string, text: string): Promise<void> {
    await this.page.evaluate(
      async ({ title, text }) => {
        const state = await window.findy.getState()
        const application = state.applications.find((item) => item.title === title)
        if (!application) throw new Error(`No application "${title}"`)
        await window.findy.addNote(application.id, text)
      },
      { title, text },
    )
  }

  /** Spec 007 */
  async setColor(title: string, color: CardColor | null): Promise<void> {
    await this.page.evaluate(
      async ({ title, color }) => {
        const state = await window.findy.getState()
        const application = state.applications.find((item) => item.title === title)
        if (!application) throw new Error(`No application "${title}"`)
        await window.findy.setApplicationColor(application.id, color)
      },
      { title, color },
    )
  }

  /** Spec 011: a site of the user, behind the UI */
  async addSite(name: string, url: string): Promise<void> {
    await this.page.evaluate((site) => window.findy.addSite(site), { name, url })
  }

  async deleteSite(name: string): Promise<void> {
    await this.page.evaluate(async (value) => {
      const state = await window.findy.getState()
      await window.findy.deleteSite(state.sites.find((site) => site.name === value)!.id)
    }, name)
  }

  async resetBoard(): Promise<void> {
    await this.page.evaluate(() => window.findy.resetBoard())
  }

  async setTheme(theme: Theme): Promise<void> {
    await this.page.evaluate((value) => window.findy.setTheme(value), theme)
  }

  async setAnalyticsView(view: AnalyticsView): Promise<void> {
    await this.page.evaluate((value) => window.findy.setAnalyticsView(value), view)
  }

  async setHiddenStages(stages: StageId[]): Promise<void> {
    await this.page.evaluate((value) => window.findy.setHiddenStages(value), stages)
  }

  /** Message of the rejected move, or "saved" */
  tryMove(title: string, stage: StageId): Promise<string> {
    return this.page.evaluate(
      async ({ title, stage }) => {
        const state = await window.findy.getState()
        const id = state.applications.find((item) => item.title === title)!.id
        return window.findy.moveApplication(id, { stage, index: 0 }).then(
          () => 'saved',
          (error: Error) => error.message,
        )
      },
      { title, stage },
    )
  }

  /** The connection the app shows the user (spec 004 FR-009) */
  mcpConnection(): Promise<McpConnection> {
    return this.page.evaluate(() => window.findy.getMcpConnection())
  }

  async setMcpEnabled(enabled: boolean): Promise<void> {
    await this.page.evaluate((value) => window.findy.setMcpEnabled(value), enabled)
  }

  async setLanguage(language: Language): Promise<void> {
    await this.page.evaluate((value) => window.findy.setLanguage(value), language)
  }

  state(): Promise<AppState> {
    return this.page.evaluate(() => window.findy.getState())
  }

  /** Message of the rejected IPC call, or "saved". */
  tryCreate(input: NewApplication): Promise<string> {
    return this.page.evaluate(
      (value) =>
        window.findy.createApplication(value).then(
          () => 'saved',
          (error: Error) => error.message,
        ),
      input,
    )
  }

  /** Constitution §III: Node.js must not leak into the renderer. */
  rendererHasRequire(): Promise<boolean> {
    return this.page.evaluate(
      () => typeof (globalThis as { require?: unknown }).require !== 'undefined',
    )
  }

  /** `window.open` must be denied (docs/security.md). */
  windowOpenWorks(): Promise<boolean> {
    return this.page.evaluate(() => window.open('https://example.com') !== null)
  }

  /**
   * Spec 010 US-1.6: a fake clock in the window, from now on. Takes effect after the next
   * reload (`findy.refresh()`); `advanceClock` then moves it forward and fires its timers.
   */
  async installClock(): Promise<void> {
    await this.page.clock.install()
  }

  async advanceClock(ms: number): Promise<void> {
    await this.page.clock.fastForward(ms)
  }

  /** NFR-005: e.g. the minimum window size of spec 001 */
  /** Spec 013 FR-012: the system setting to reduce motion */
  async reduceMotion(): Promise<void> {
    await this.page.emulateMedia({ reducedMotion: 'reduce' })
  }

  async setWindowSize(width: number, height: number): Promise<void> {
    await this.app.evaluate(
      ({ BrowserWindow }, size) =>
        BrowserWindow.getAllWindows()[0]!.setSize(size.width, size.height),
      { width, height },
    )
  }

  /** True when the window content is wider than the window (NFR-005) */
  hasHorizontalScroll(): Promise<boolean> {
    return this.page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
  }

  osPrefersDark(): Promise<boolean> {
    return this.page.evaluate(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  }
}
