import { mkdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/** One system clipboard for all test workers: they take turns (spec 009 e2e) */
const LOCK = join(tmpdir(), 'findy-e2e-clipboard.lock')
/** A lock older than this was left by a crashed worker */
const STALE_MS = 15_000

/** Runs `action` while no other worker uses the clipboard (mkdir is atomic). */
export async function withClipboardLock<T>(action: () => Promise<T>): Promise<T> {
  for (;;) {
    try {
      mkdirSync(LOCK)
      break
    } catch {
      try {
        if (Date.now() - statSync(LOCK).mtimeMs > STALE_MS) rmSync(LOCK, { recursive: true })
      } catch {
        // released meanwhile
      }
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
  }
  try {
    return await action()
  } finally {
    rmSync(LOCK, { recursive: true, force: true })
  }
}
