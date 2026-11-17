import type { ElectronApplication, Page } from '@playwright/test'
import type { AppState, Language, NewApplication, StageId, Theme } from '../../src/shared/ipc'

export interface SeedApplication {
  title: string
  company?: string
  url?: string | null
  stage?: StageId
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

  async setTheme(theme: Theme): Promise<void> {
    await this.page.evaluate((value) => window.findy.setTheme(value), theme)
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

  osPrefersDark(): Promise<boolean> {
    return this.page.evaluate(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  }
}
