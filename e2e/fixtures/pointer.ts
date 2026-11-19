import { expect, type Page } from '@playwright/test'
import type { Pointer } from '../screens/pointer'

/**
 * `locator.dragTo` releases right after the last move. Under load dnd-kit may not
 * have handled that move yet, and the card falls back. Here the screen passes checks
 * that must pass first (issue #23):
 * - `started`: the drag is active. Only then the long move starts: dnd-kit measures
 *   the drag preview when it appears, and a preview that appears late, in the middle
 *   of the move, is measured off its place, so the drop target is wrong.
 * - `ready`: the app shows the drop. If not yet, the pointer moves 1 px and the
 *   check runs again: a new move makes dnd-kit compute the target again.
 */
export function mousePointer(page: Page): Pointer {
  return {
    async drag(source, to, { started, ready }) {
      const box = await source.boundingBox()
      if (!box) throw new Error('Drag source is not visible')
      const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
      await page.mouse.move(start.x, start.y)
      await page.mouse.down()
      await page.mouse.move(start.x + 12, start.y, { steps: 4 }) // past the 5 px activation distance
      await started()
      await page.mouse.move(to.x, to.y, { steps: 20 })
      let nudge = 0
      await expect(async () => {
        await page.mouse.move(to.x, to.y + nudge)
        nudge = nudge === 0 ? 1 : 0
        await ready()
      }).toPass({ timeout: 10_000 })
      await page.mouse.up()
    },
  }
}
