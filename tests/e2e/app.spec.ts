import { _electron as electron, expect, test } from '@playwright/test'

const args = ['.']
if (process.env.CI && process.platform === 'linux') args.push('--no-sandbox')

test('app window opens with a secure renderer', async () => {
  const app = await electron.launch({ args })
  const page = await app.firstWindow()

  await expect(page.getByTestId('app')).toBeVisible()
  // constitution §III: no Node.js in the renderer, only the preload API
  expect(await page.evaluate(() => typeof (globalThis as { require?: unknown }).require)).toBe(
    'undefined',
  )
  expect(await page.evaluate(() => typeof (globalThis as { findy?: unknown }).findy)).toBe('object')

  await app.close()
})
