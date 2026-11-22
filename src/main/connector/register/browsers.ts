// Spec 019 FR-011, FR-012: where each browser looks for host manifests of the user.
import { join } from 'node:path'
import type { BrowserKind } from './manifest'

export interface BrowserFolder {
  name: string
  kind: BrowserKind
  /** Exists when the browser is installed for this user */
  profile: string
  /** The folder for the host manifest */
  hosts: string
}

/**
 * macOS and Linux only; Windows uses registry keys (windows.ts). Chromium-based browsers
 * read `NativeMessagingHosts` in their own profile folder. Opera reads the folder of
 * Chrome, so Chrome's entry is also written when only Opera is installed.
 */
export function browserFolders(
  platform: NodeJS.Platform,
  home: string,
  env: NodeJS.ProcessEnv = {},
): BrowserFolder[] {
  const chromium = (name: string, profile: string): BrowserFolder => ({
    name,
    kind: 'chromium',
    profile,
    hosts: join(profile, 'NativeMessagingHosts'),
  })
  if (platform === 'darwin') {
    const support = join(home, 'Library', 'Application Support')
    const chrome = join(support, 'Google', 'Chrome')
    return [
      chromium('Chrome', chrome),
      {
        ...chromium('Opera', join(support, 'com.operasoftware.Opera')),
        hosts: join(chrome, 'NativeMessagingHosts'),
      },
      chromium('Chromium', join(support, 'Chromium')),
      chromium('Edge', join(support, 'Microsoft Edge')),
      chromium('Brave', join(support, 'BraveSoftware', 'Brave-Browser')),
      chromium('Vivaldi', join(support, 'Vivaldi')),
      {
        name: 'Firefox',
        kind: 'firefox',
        profile: join(support, 'Firefox'),
        hosts: join(support, 'Mozilla', 'NativeMessagingHosts'),
      },
    ]
  }
  if (platform === 'linux') {
    const config = env.XDG_CONFIG_HOME ?? join(home, '.config')
    const chrome = join(config, 'google-chrome')
    return [
      chromium('Chrome', chrome),
      { ...chromium('Opera', join(config, 'opera')), hosts: join(chrome, 'NativeMessagingHosts') },
      chromium('Chromium', join(config, 'chromium')),
      chromium('Edge', join(config, 'microsoft-edge')),
      chromium('Brave', join(config, 'BraveSoftware', 'Brave-Browser')),
      chromium('Vivaldi', join(config, 'vivaldi')),
      {
        name: 'Firefox',
        kind: 'firefox',
        profile: join(home, '.mozilla'),
        hosts: join(home, '.mozilla', 'native-messaging-hosts'),
      },
    ]
  }
  return []
}
