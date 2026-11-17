import { homedir } from 'node:os'
import { join } from 'node:path'

/** productName in package.json; Electron names the data folder after it */
export const APP_NAME = 'Findy'

/**
 * The folder that holds Findy's database: Electron's `app.getPath('userData')`,
 * computed without Electron so the MCP server can run in Node mode (architecture
 * D-8). `FINDY_USER_DATA_DIR` isolates e2e tests and screenshots.
 */
export function userDataDir(
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
  home: string = homedir(),
): string {
  if (env.FINDY_USER_DATA_DIR) return env.FINDY_USER_DATA_DIR
  if (platform === 'darwin') return join(home, 'Library', 'Application Support', APP_NAME)
  if (platform === 'win32') return join(env.APPDATA ?? join(home, 'AppData', 'Roaming'), APP_NAME)
  return join(env.XDG_CONFIG_HOME ?? join(home, '.config'), APP_NAME)
}
