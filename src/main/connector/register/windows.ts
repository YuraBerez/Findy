// Spec 019 FR-011: on Windows, browsers find host manifests through registry keys of the
// user. Brave, Opera and Vivaldi read the key of Chrome.
import { EXTENSION_HOST } from '../../../shared/extension'
import type { BrowserKind } from './manifest'

export interface RegistryKey {
  name: string
  kind: BrowserKind
  key: string
}

export const REGISTRY_KEYS: RegistryKey[] = (
  [
    { name: 'Chrome', kind: 'chromium', key: 'Google\\Chrome' },
    { name: 'Chromium', kind: 'chromium', key: 'Chromium' },
    { name: 'Edge', kind: 'chromium', key: 'Microsoft\\Edge' },
    { name: 'Firefox', kind: 'firefox', key: 'Mozilla' },
  ] as const
).map(({ key, ...rest }) => ({
  ...rest,
  key: `HKCU\\Software\\${key}\\NativeMessagingHosts\\${EXTENSION_HOST}`,
}))

/** `reg.exe` arguments that set the default value of `key` to the manifest path */
export const regAddArgs = (key: string, manifest: string): string[] => [
  'add',
  key,
  '/ve',
  '/t',
  'REG_SZ',
  '/d',
  manifest,
  '/f',
]
