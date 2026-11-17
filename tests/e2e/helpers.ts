import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { _electron as electron, type ElectronApplication, type Page } from '@playwright/test'

export function newUserDataDir(): string {
  return mkdtempSync(join(tmpdir(), 'findy-e2e-'))
}

/** Launches the built app (`out/`) with an isolated database directory. */
export async function launchApp(
  userDataDir: string = newUserDataDir(),
): Promise<{ app: ElectronApplication; page: Page; userDataDir: string }> {
  // Pin the UI language: FR-041 would otherwise follow the developer's OS locale
  const args = ['.', '--lang=en-US']
  if (process.env.CI && process.platform === 'linux') args.push('--no-sandbox')
  const app = await electron.launch({
    args,
    env: { ...process.env, FINDY_USER_DATA_DIR: userDataDir, LANG: 'en_US.UTF-8' },
  })
  const page = await app.firstWindow()
  // Playwright emulates a light color scheme by default; let nativeTheme drive it (FR-080)
  await page.emulateMedia({ colorScheme: null })
  await page.getByTestId('app').waitFor()
  return { app, page, userDataDir }
}
