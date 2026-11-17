import { test } from '../fixtures/app'

test.describe('theme (US-9)', () => {
  test(
    'the sun/moon toggle switches the theme at once and remembers it',
    { tag: '@critical' },
    async ({ findy }) => {
      const os = (await findy.api.osPrefersDark()) ? 'dark' : 'light'
      const other = os === 'dark' ? 'light' : 'dark'

      await test.step('9.1: before the first use the toggle follows the OS', async () => {
        await findy.pages.board.verifyTheme(os)
      })
      await test.step('9.2: a click flips the whole window', async () => {
        await findy.pages.board.toggleTheme()
        await findy.pages.board.verifyTheme(other)
      })
      await test.step('FR-081: Space and Enter flip it too', async () => {
        await findy.pages.board.toggleThemeWithKey('Space')
        await findy.pages.board.verifyTheme(os)
        await findy.pages.board.toggleThemeWithKey('Enter')
        await findy.pages.board.verifyTheme(other)
      })
      await test.step('9.4: the choice survives a restart', async () => {
        const { board } = await findy.restart()
        await board.verifyTheme(other)
      })
    },
  )
})
