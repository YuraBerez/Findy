// Spec 023 FR-021…FR-023: the analytics image goes to the clipboard or to a file that the
// user picks in the system save dialog. The renderer sends only the PNG bytes (plan D-2).
import type { SaveFileResult } from '../shared/ipc'

export interface ImageSharerDeps {
  /** Puts the PNG on the system clipboard as an image; rejects when it cannot */
  writeClipboard(png: Uint8Array): Promise<void>
  /** System save dialog; null when the user cancels */
  pickSavePath(defaultName: string): Promise<string | null>
  writeBytes(path: string, data: Uint8Array): Promise<void>
  now(): Date
}

const pad = (value: number) => String(value).padStart(2, '0')

/** FR-022, plan D-6: `findy-analytics-YYYY-MM-DD.png` with the local date */
export function imageFileName(now: Date): string {
  return `findy-analytics-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.png`
}

export function createImageSharer(deps: ImageSharerDeps) {
  return {
    copy(png: Uint8Array): Promise<void> {
      return deps.writeClipboard(png)
    },
    /** FR-023: a failed write rejects, and the IPC layer reports it as STORAGE */
    async save(png: Uint8Array): Promise<SaveFileResult> {
      const path = await deps.pickSavePath(imageFileName(deps.now()))
      if (path === null) return { status: 'cancelled' }
      await deps.writeBytes(path, png)
      return { status: 'saved' }
    },
  }
}

export type ImageSharer = ReturnType<typeof createImageSharer>
