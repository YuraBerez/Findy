import { test } from '../fixtures/app'

test.describe('theme (US-9, spec 018 FR-011)', () => {
  test(
    'Settings → Theme: System follows the OS; Light and Dark are kept after a restart',
    { tag: '@critical' },
    async ({ findy }) => {
      const { board, settings } = findy.pages
      const osDark = await findy.api.osPrefersDark()
      const os = osDark ? 'dark' : 'light'
      const other = osDark ? 'light' : 'dark'
      const otherName = osDark ? 'Light' : 'Dark'

      await test.step('9.1: before a choice the theme follows the OS', async () => {
        await board.verifyTheme(os)
        await settings.open('General')
        await settings.verifyTheme('System')
      })
      await test.step('9.2: a choice changes the whole window at once', async () => {
        await settings.chooseTheme(otherName)
        await board.verifyTheme(other)
      })
      await test.step('FR-011: System follows the OS again', async () => {
        await settings.chooseTheme('System')
        await board.verifyTheme(os)
        await settings.chooseTheme(otherName)
        await settings.close()
      })
      await test.step('9.4: the choice survives a restart', async () => {
        const pages = await findy.restart()
        await pages.board.verifyTheme(other)
        await pages.settings.open('General')
        await pages.settings.verifyTheme(otherName)
      })
    },
  )
})
