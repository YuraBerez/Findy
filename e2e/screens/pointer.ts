import type { Locator } from '@playwright/test'

/**
 * Drags like a person: pick up, move, wait until the app shows the drop, release.
 * The mouse implementation lives in the fixtures (page objects never use input devices).
 */
export interface Pointer {
  drag(source: Locator, to: { x: number; y: number }, ready: () => Promise<void>): Promise<void>
}
