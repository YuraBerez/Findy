// Spec 019: the browser extension and the connector it talks to. Every id and store link
// of the extension is built here, so a new store listing changes one line.

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

/** Protocol version of the connector messages (docs/contracts/native-messaging.md) */
export const CONNECTOR_PROTOCOL = 1
