import { expect, test } from '../fixtures/app'

test.describe('language (US-5)', () => {
  test(
    'US-5.2 and 5.3: switch to Ukrainian at once and keep it',
    { tag: '@critical' },
    async ({ findy }) => {
      await test.step('switch', async () => {
        await findy.pages.board.chooseLanguage('Українська')
        await findy.pages.board.verifyLanguage('Українська', 'Додати заявку')
        await findy.pages.board.verifyStageNames([
          'Заявку надіслано',
          'HR-співбесіда',
          'Тестове завдання',
          'Технічна співбесіда',
          'Співбесіда з C-level',
          'Офер',
          'Відмова',
        ])
      })
      await test.step('FR-044: the native menu follows at once', async () => {
        await expect.poll(() => findy.api.menuLabels()).toContain('Редагування')
      })
      await test.step('restart', async () => {
        const { board } = await findy.restart()
        await board.verifyLanguage('Українська', 'Додати заявку')
      })
      await test.step('and back to English', async () => {
        await findy.pages.board.chooseLanguage('English')
        await findy.pages.board.verifyLanguage('English', 'Add application')
      })
    },
  )

  test.describe('US-5.1: first launch on a Ukrainian system', () => {
    test.use({ systemLocale: 'uk-UA' })

    test('shows the UI in Ukrainian', async ({ findy }) => {
      await findy.pages.board.verifyLanguage('Українська', 'Додати заявку')
      await findy.pages.board.verifyEmptyState('Ще немає заявок')
    })
  })
})
