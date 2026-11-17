import { expect, test } from '@playwright/test'
import { launchApp } from './helpers'

test('app window opens with a secure renderer (NFR-004)', async () => {
  const { app, page } = await launchApp()

  await expect(page.getByRole('banner')).toContainText('Findy')
  // constitution §III: no Node.js in the renderer, only the preload API
  expect(await page.evaluate(() => typeof (globalThis as { require?: unknown }).require)).toBe(
    'undefined',
  )
  expect(await page.evaluate(() => typeof (globalThis as { findy?: unknown }).findy)).toBe('object')
  // window.open is denied
  expect(await page.evaluate(() => window.open('https://example.com'))).toBeNull()
  expect(app.windows()).toHaveLength(1)

  await app.close()
})

test('invalid IPC input is rejected with a validation error', async () => {
  const { app, page } = await launchApp()
  const message = await page.evaluate(() =>
    window.findy.createApplication({ title: '', company: 'x' }).then(
      () => 'saved',
      (error: Error) => error.message,
    ),
  )
  expect(message).toMatch(/VALIDATION: /)
  await app.close()
})
