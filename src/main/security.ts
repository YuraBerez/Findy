import { isHttpUrl } from '../domain/limits'
import type { IpcResult } from '../shared/ipc'

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

/**
 * docs/security.md: only the app page may call main. `frameUrl` is the URL of the frame
 * that sent the IPC message; it is missing when that frame is already gone.
 */
export function isAppSender(frameUrl: string | undefined, devServerUrl: string | undefined) {
  return frameUrl !== undefined && isAllowedNavigation(frameUrl, devServerUrl)
}

/** The answer to an IPC call from any other sender; the handler does not run */
export const UNKNOWN_SENDER: IpcResult<never> = {
  ok: false,
  error: { code: 'VALIDATION', message: 'Unknown sender' },
}
