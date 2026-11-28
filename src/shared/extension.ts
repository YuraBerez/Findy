// Spec 019: the browser extension and the connector it talks to. Every id and store link
// of the extension is built here, so a new store listing changes one line.
import { FALLBACK_LANGUAGE } from '../domain/language'
import type { Language } from '../domain/types'
import { releaseFileUrl, SITE_URL } from './project'

/** Native messaging host name: the same as `appId` in electron-builder.yml */
export const EXTENSION_HOST = 'io.github.findy'

/** Chrome Web Store id, fixed by the `key` field of the Chromium manifest (plan D-3) */
export const CHROMIUM_EXTENSION_ID = 'inpfooemhgjckhjffffcgbbbbmbblglg'

/** addons.mozilla.org id (`browser_specific_settings.gecko.id`) */
export const FIREFOX_EXTENSION_ID = 'extension@findy.github.io'

/** FR-011: the only extension origin a Chromium host manifest accepts */
export const CHROMIUM_EXTENSION_ORIGIN = `chrome-extension://${CHROMIUM_EXTENSION_ID}/`

/** Store pages of the extension (README, the settings window) */
export const CHROME_STORE_URL = `https://chromewebstore.google.com/detail/${CHROMIUM_EXTENSION_ID}`
export const FIREFOX_STORE_URL = 'https://addons.mozilla.org/firefox/addon/findy/'

/** The browsers that have their own extension file in a release (spec 019 D-8) */
export type ExtensionBuild = 'chromium' | 'firefox'

/** Spec 024 FR-003: the extension file of a release, as `release.yml` names it */
export function extensionFileName(version: string, build: ExtensionBuild): string {
  return `Findy-${version}-browser-extension${build === 'firefox' ? '-Firefox' : ''}.zip`
}

/** Spec 024 FR-003: the download link of the extension file of the app version */
export const extensionFileUrl = (version: string, build: ExtensionBuild): string =>
  releaseFileUrl(`v${version}`, extensionFileName(version, build))

/**
 * Spec 024 FR-004, spec 027 FR-006: the browser extension guide on the website in the app
 * language. English is at the root, the other languages under `<id>/` (spec 020 FR-020).
 */
export const extensionGuideUrl = (language: Language): string =>
  `${SITE_URL}${language === FALLBACK_LANGUAGE ? '' : `${language}/`}guide/browser-extension/`

/** Protocol version of the connector messages (docs/contracts/native-messaging.md) */
export const CONNECTOR_PROTOCOL = 1
