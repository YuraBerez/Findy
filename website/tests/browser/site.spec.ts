import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { GUIDES } from '../../src/lib/guides'
import { LANGS, guidePage, pagePath } from '../../src/lib/paths'

// Spec 020: the website in a real browser
const PAGES = LANGS.flatMap((lang) =>
  ['', ...GUIDES.map(guidePage)].map((page) => pagePath(lang, page)),
)

const WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0'
const MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15'
const LINUX = 'Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0'
const PHONE = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Mobile Safari/537.36'

/** Errors in the console, also CSP violations (NFR-001) */
function watchErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

for (const path of PAGES) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`/${path} has no accessibility violations in the ${colorScheme} theme (NFR-002, NFR-003)`, async ({
      page,
    }) => {
      const errors = watchErrors(page)
      await page.emulateMedia({ colorScheme })
      await page.goto(path)
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()
      expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual(
        [],
      )
      expect(errors).toEqual([])
    })
  }

  test(`/${path} fits a phone screen (NFR-004)`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    await page.goto(path)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
}

test.describe('system of the visitor (FR-011, FR-013)', () => {
  const cases = [
    { name: 'Windows', userAgent: WINDOWS, os: 'windows' },
    { name: 'macOS', userAgent: MAC, os: 'mac' },
    { name: 'Linux', userAgent: LINUX, os: 'linux' },
  ]
  for (const { name, userAgent, os } of cases) {
    test.describe(name, () => {
      test.use({ userAgent })
      test(`shows the main button for ${name} only`, async ({ page }) => {
        await page.goto('')
        await expect(page.locator(`.main[data-for=${os}]`)).toBeVisible()
        await expect(page.locator('.main:visible')).toHaveCount(1)
      })
    })
  }

  test.describe('phone', () => {
    test.use({ userAgent: PHONE, hasTouch: true })
    test('shows no main button, but every build', async ({ page }) => {
      await page.goto('')
      await expect(page.locator('.main:visible')).toHaveCount(0)
      await expect(page.locator('#download .card a').first()).toBeVisible()
    })
  })

  test.describe('no scripts', () => {
    test.use({ javaScriptEnabled: false, userAgent: WINDOWS })
    test('shows every build (FR-015)', async ({ page }) => {
      await page.goto('')
      await expect(page.locator('.main:visible')).toHaveCount(0)
      expect(
        await page.locator('#download .card a[href*="/releases/download/"]').count(),
      ).toBeGreaterThanOrEqual(6)
    })
  })
})

test.describe('keyboard (NFR-002)', () => {
  test.use({ userAgent: WINDOWS })
  test('reaches the skip link, the language switch and the download button', async ({ page }) => {
    await page.goto('')
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused()

    const reached = new Set<string>()
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab')
      reached.add(await page.evaluate(() => document.activeElement?.textContent?.trim() ?? ''))
    }
    expect([...reached]).toContain('English')
    expect([...reached].some((text) => text.startsWith('Installer'))).toBe(true)
  })

  test('opens the same page in the other language from the menu (FR-020)', async ({ page }) => {
    await page.goto(guidePage('install'))
    const menu = page.locator('header [data-language-menu]')
    const language = page.getByRole('link', { name: 'Українська' })
    await expect(language).toBeHidden()
    await menu.locator('summary').focus()
    await page.keyboard.press('Enter')
    await expect(language).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(language).toBeHidden()
    await expect(menu.locator('summary')).toBeFocused()
    await page.keyboard.press('Enter')
    await language.press('Enter')
    await expect(page).toHaveURL(/\/uk\/guide\/install\/$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'uk')
  })

  test('closes the language menu with a click outside it', async ({ page }) => {
    await page.goto('')
    await page.locator('header [data-language-menu] summary').click()
    await expect(page.getByRole('link', { name: 'Українська' })).toBeVisible()
    await page.locator('main h1').click()
    await expect(page.getByRole('link', { name: 'Українська' })).toBeHidden()
  })
})

test.describe('screenshot slider (FR-003)', () => {
  const current = (page: Page) => page.locator('[data-slider] [data-dot][aria-current="true"]')

  test('changes the screenshot by itself, and with the buttons and the dots', async ({ page }) => {
    await page.clock.install()
    await page.goto('')
    await expect(current(page)).toHaveAttribute('data-dot', '0')
    await page.clock.runFor(5100)
    await expect(current(page)).toHaveAttribute('data-dot', '1')
    await page.getByRole('button', { name: 'Next screenshot' }).click()
    await expect(current(page)).toHaveAttribute('data-dot', '2')
    await page.getByRole('button', { name: 'Screenshot 1 of 4' }).click()
    await expect(current(page)).toHaveAttribute('data-dot', '0')
    await page.getByRole('button', { name: 'Previous screenshot' }).click()
    await expect(current(page)).toHaveAttribute('data-dot', '3')
  })

  test('stops with the pause button (WCAG 2.2.2)', async ({ page }) => {
    await page.clock.install()
    await page.goto('')
    await page.getByRole('button', { name: 'Pause the slideshow' }).click()
    await page.mouse.move(0, 0)
    await page.locator('main h1').focus()
    await page.clock.runFor(12000)
    await expect(current(page)).toHaveAttribute('data-dot', '0')
    await expect(page.getByRole('button', { name: 'Play the slideshow' })).toBeVisible()
  })

  test.describe('reduced motion', () => {
    test.use({ reducedMotion: 'reduce' })
    test('does not change by itself', async ({ page }) => {
      await page.clock.install()
      await page.goto('')
      await page.clock.runFor(12000)
      await expect(current(page)).toHaveAttribute('data-dot', '0')
    })
  })
})

test.describe('theme button (NFR-003)', () => {
  test.use({ colorScheme: 'light' })
  test('switches the theme and keeps it after a reload', async ({ page }) => {
    await page.goto('')
    const background = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    const light = await background()
    await page.getByRole('button', { name: 'Switch to the dark theme' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    expect(await background()).not.toBe(light)
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await page.getByRole('button', { name: 'Switch to the light theme' }).click()
    expect(await background()).toBe(light)
  })
})
