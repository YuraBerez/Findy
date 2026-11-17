import { expect, test, type Page } from '@playwright/test'
import { launchApp, newUserDataDir } from './helpers'

const prefersDark = (page: Page) =>
  page.evaluate(() => window.matchMedia('(prefers-color-scheme: dark)').matches)

const background = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor)

test('US-9: sun/moon toggle switches the theme at once and remembers it', async () => {
  const dir = newUserDataDir()
  let { app, page } = await launchApp(dir)
  const toggle = page.getByRole('switch', { name: 'Dark theme' })

  // 9.1: before the first use the toggle mirrors the OS theme
  const osDark = await prefersDark(page)
  await expect(toggle).toHaveAttribute('aria-checked', String(osDark))

  // 9.2: a click flips the whole window at once
  const before = await background(page)
  await toggle.click()
  await expect.poll(() => prefersDark(page)).toBe(!osDark)
  await expect(toggle).toHaveAttribute('aria-checked', String(!osDark))
  expect(await background(page)).not.toBe(before)

  // FR-081: the keyboard flips it back
  await toggle.focus()
  await page.keyboard.press('Space')
  await expect.poll(() => prefersDark(page)).toBe(osDark)

  // 9.4: the explicit choice survives a restart
  await page.keyboard.press('Enter')
  await expect.poll(() => prefersDark(page)).toBe(!osDark)
  await app.close()

  ;({ app, page } = await launchApp(dir))
  await expect(page.getByRole('switch', { name: 'Dark theme' })).toHaveAttribute(
    'aria-checked',
    String(!osDark),
  )
  expect(await prefersDark(page)).toBe(!osDark)
  await app.close()
})
