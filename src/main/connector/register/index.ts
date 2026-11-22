// Spec 019 FR-011: on every start, the app writes the launcher and a host manifest for each
// installed browser (plan D-2). Files change only when their content changes.
import { dirname, join } from 'node:path'
import { browserFolders } from './browsers'
import { launcherFile, type LauncherTarget } from './launcher'
import { hostManifest, MANIFEST_FILE, type BrowserKind } from './manifest'
import { regAddArgs, REGISTRY_KEYS } from './windows'

export { launcherFile } from './launcher'
export { hostManifest, MANIFEST_FILE } from './manifest'

export interface RegisterFs {
  exists(path: string): boolean
  readText(path: string): string | null
  writeText(path: string, content: string, mode?: number): void
  mkdir(path: string): void
}

export interface RegisterOptions extends LauncherTarget {
  platform: NodeJS.Platform
  home: string
  userData: string
  env?: NodeJS.ProcessEnv
  fs: RegisterFs
  /** Runs `reg.exe` with these arguments (Windows only) */
  runReg(args: string[]): Promise<void>
}

/** The browsers that now know the connector */
export interface RegisterResult {
  launcher: string
  browsers: string[]
}

function writeIfChanged(fs: RegisterFs, path: string, content: string, mode?: number): void {
  if (fs.readText(path) === content) return
  fs.mkdir(dirname(path))
  fs.writeText(path, content, mode)
}

export async function registerConnector(options: RegisterOptions): Promise<RegisterResult> {
  const { fs, platform } = options
  const folder = join(options.userData, 'connector')
  const file = launcherFile(platform, options)
  const launcher = join(folder, file.name)
  writeIfChanged(fs, launcher, file.content, 0o755)

  if (platform === 'win32') {
    const manifests: Record<BrowserKind, string> = {
      chromium: join(folder, `chromium-${MANIFEST_FILE}`),
      firefox: join(folder, `firefox-${MANIFEST_FILE}`),
    }
    for (const kind of ['chromium', 'firefox'] as const)
      writeIfChanged(fs, manifests[kind], hostManifest(kind, launcher))
    // All keys: Brave, Opera and Vivaldi read Chrome's key without Chrome installed
    for (const entry of REGISTRY_KEYS)
      await options.runReg(regAddArgs(entry.key, manifests[entry.kind]))
    return { launcher, browsers: REGISTRY_KEYS.map((entry) => entry.name) }
  }

  const browsers: string[] = []
  for (const browser of browserFolders(platform, options.home, options.env)) {
    if (!fs.exists(browser.profile)) continue
    writeIfChanged(fs, join(browser.hosts, MANIFEST_FILE), hostManifest(browser.kind, launcher))
    browsers.push(browser.name)
  }
  return { launcher, browsers }
}

/**
 * FR-011: where to register. A packaged app uses the real home folder. Development and
 * e2e runs register only into `FINDY_CONNECTOR_HOME`, so they never change the manifests
 * of the user's browsers. `null`: do not register.
 */
export function registrationHome(
  packaged: boolean,
  env: NodeJS.ProcessEnv,
  home: string,
): string | null {
  if (env.FINDY_CONNECTOR_HOME) return env.FINDY_CONNECTOR_HOME
  return packaged ? home : null
}
