import { expect, test, type Page } from '@playwright/test'
import { launchApp, newUserDataDir } from './helpers'

const prefersDark = (page: Page) =>
  page.evaluate(() => window.matchMedia('(prefers-color-scheme: dark)').matches)

const background = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor)

test('US-9: theme switcher changes the theme at once and remembers it', async () => {
  const dir = newUserDataDir()
  let { app, page } = await launchApp(dir)
  const switcher = page.getByRole('group', { name: 'Theme' })

  // 9.1: System is the default
  await expect(switcher.getByRole('radio', { name: 'System' })).toBeChecked()

  // 9.2: Dark applies without restart
  await switcher.getByRole('radio', { name: 'Dark' }).check()
  await expect(switcher.getByRole('radio', { name: 'Dark' })).toBeChecked()
  await expect.poll(() => prefersDark(page)).toBe(true)
  const darkBackground = await background(page)

  // Light, chosen with the keyboard (FR-081)
  await switcher.getByRole('radio', { name: 'Dark' }).focus()
  await page.keyboard.press('ArrowLeft')
  await expect(switcher.getByRole('radio', { name: 'Light' })).toBeChecked()
  await expect.poll(() => prefersDark(page)).toBe(false)
  expect(await background(page)).not.toBe(darkBackground)

  // 9.5: the choice survives a restart
  await switcher.getByRole('radio', { name: 'Dark' }).check()
  await expect.poll(() => prefersDark(page)).toBe(true)
  await app.close()

  ;({ app, page } = await launchApp(dir))
  await expect(
    page.getByRole('group', { name: 'Theme' }).getByRole('radio', { name: 'Dark' }),
  ).toBeChecked()
  expect(await prefersDark(page)).toBe(true)
  await app.close()
})
