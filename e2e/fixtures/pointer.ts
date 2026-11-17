import type { Page } from '@playwright/test'
import type { Pointer } from '../screens/pointer'

/**
 * `locator.dragTo` releases right after the last move. Under load dnd-kit may not
 * have handled that move yet, and the card falls back. Here the screen passes a
 * `ready` check (e.g. the preview is in the target column) that must pass first.
 */
export function mousePointer(page: Page): Pointer {
  return {
    async drag(source, to, ready) {
      const box = await source.boundingBox()
      if (!box) throw new Error('Drag source is not visible')
      const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
      await page.mouse.move(start.x, start.y)
      await page.mouse.down()
      await page.mouse.move(start.x + 12, start.y, { steps: 4 }) // past the 5 px activation distance
      await page.mouse.move(to.x, to.y, { steps: 20 })
      await ready()
      await page.mouse.up()
    },
  }
}
