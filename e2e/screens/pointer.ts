import type { Locator } from '@playwright/test'

/** Checks of the app state during a drag; each one fails fast, the pointer retries `ready` */
export interface DragChecks {
  /** The drag is active (the preview follows the pointer) */
  started: () => Promise<void>
  /** The app shows the drop at the target */
  ready: () => Promise<void>
}

/**
 * Drags like a person: pick up, wait until the app picks the card up, move, wait
 * until the app shows the drop, release.
 * The mouse implementation lives in the fixtures (page objects never use input devices).
 */
export interface Pointer {
  drag(source: Locator, to: { x: number; y: number }, checks: DragChecks): Promise<void>
}
