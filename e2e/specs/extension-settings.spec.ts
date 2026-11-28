// Spec 024: the browser extension in the settings window
import { expect, test } from '../fixtures/app'
import { PROJECT_URL, SITE_URL } from '../../src/shared/project'

test.describe('browser extension in the settings (spec 024)', () => {
  test('US-1, US-2: the page describes the extension and opens its links', async ({ findy }) => {
    const { settings } = findy.pages
    const version = await findy.api.appVersion()
    const files = `${PROJECT_URL}/releases/download/v${version}/Findy-${version}-browser-extension`
    await findy.api.captureExternalLinks()

    await test.step('1.1, 1.2: the last category, with the description', async () => {
      await settings.open('Browser extension')
      await settings.verifyPage('Browser extension')
      await settings.verifyExtensionText(/adds the vacancy that you see to Applied in one click/)
      await settings.verifyExtensionText(/talks only to the Findy app on this computer/)
    })
    await test.step('2.1–2.3: both downloads and the English guide', async () => {
      await settings.downloadExtension('chromium')
      await settings.downloadExtension('firefox')
      await settings.openExtensionGuide()
      await expect
        .poll(() => findy.api.openedLinks())
        .toEqual([`${files}.zip`, `${files}-Firefox.zip`, `${SITE_URL}guide/browser-extension/`])
    })
  })

  test('2.4: the guide in Ukrainian; US-3: keyboard', async ({ findy }) => {
    const { settings } = findy.pages
    await findy.api.setLanguage('uk')
    await findy.refresh()
    await findy.api.captureExternalLinks()
    await settings.open('Браузерне розширення')
    await settings.verifyExtensionText(/Воно спілкується лише із застосунком Findy/)
    await settings.openExtensionGuide()
    await settings.downloadExtensionWithKeyboard()
    const version = await findy.api.appVersion()
    await expect
      .poll(() => findy.api.openedLinks())
      .toEqual([
        `${SITE_URL}uk/guide/browser-extension/`,
        `${PROJECT_URL}/releases/download/v${version}/Findy-${version}-browser-extension.zip`,
      ])
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`NFR-002: the page has no violations (${theme})`, { tag: '@a11y' }, async ({ findy }) => {
      await findy.api.setTheme(theme)
      await findy.refresh()
      await findy.pages.settings.open('Browser extension')
      await findy.pages.a11y.expectNoViolations()
    })
  }
})
