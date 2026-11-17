import { test } from '../fixtures/app'

test.describe('theme (US-9)', () => {
  test(
    'the sun/moon switch in the app menu changes the theme and remembers it',
    { tag: '@critical' },
    async ({ findy }) => {
      const osDark = await findy.api.osPrefersDark()
      const os = osDark ? 'dark' : 'light'
      const other = osDark ? 'light' : 'dark'

      await test.step('9.1: before a choice the theme follows the OS, and the switch agrees', async () => {
        await findy.pages.board.verifyTheme(os)
        await findy.pages.board.verifyThemeSwitch(osDark)
      })
      await test.step('9.2: the switch changes the whole window at once', async () => {
        await findy.pages.board.toggleTheme()
        await findy.pages.board.verifyTheme(other)
      })
      await test.step('FR-081: the keyboard works too', async () => {
        await findy.pages.board.toggleThemeWithKeyboard()
        await findy.pages.board.verifyTheme(os)
        await findy.pages.board.toggleThemeWithKeyboard()
        await findy.pages.board.verifyTheme(other)
      })
      await test.step('9.4: the choice survives a restart', async () => {
        const { board } = await findy.restart()
        await board.verifyTheme(other)
        await board.verifyThemeSwitch(!osDark)
      })
    },
  )
})
