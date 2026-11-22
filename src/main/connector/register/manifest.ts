// Spec 019 FR-011, NFR-002: the native messaging host manifests. Each one accepts only
// the Findy extension of one store (plan D-3).
import {
  CHROMIUM_EXTENSION_ORIGIN,
  EXTENSION_HOST,
  FIREFOX_EXTENSION_ID,
} from '../../../shared/extension'

export type BrowserKind = 'chromium' | 'firefox'

/** The file name that browsers look for in a hosts folder */
export const MANIFEST_FILE = `${EXTENSION_HOST}.json`

/** The manifest JSON for one browser family; `launcher` is an absolute path */
export function hostManifest(kind: BrowserKind, launcher: string): string {
  const common = {
    name: EXTENSION_HOST,
    description: 'Findy: add a vacancy from the browser',
    path: launcher,
    type: 'stdio',
  }
  const allowed =
    kind === 'chromium'
      ? { allowed_origins: [CHROMIUM_EXTENSION_ORIGIN] }
      : { allowed_extensions: [FIREFOX_EXTENSION_ID] }
  return `${JSON.stringify({ ...common, ...allowed }, null, 2)}\n`
}
