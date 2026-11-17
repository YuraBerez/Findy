import { isHttpUrl } from '../domain/schema'

/** FR-015: only http(s) links may leave the app, and only to the system browser. */
export function isSafeExternalUrl(url: string): boolean {
  return isHttpUrl(url)
}

/** The window may only show the app itself: the bundled file or the dev server. */
export function isAllowedNavigation(url: string, devServerUrl: string | undefined): boolean {
  try {
    const target = new URL(url)
    if (devServerUrl) return target.origin === new URL(devServerUrl).origin
    return target.protocol === 'file:'
  } catch {
    return false
  }
}
