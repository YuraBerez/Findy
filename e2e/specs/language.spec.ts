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

  test('spec 026 US-1: Polish at once, with plurals, dates and the menu', async ({ findy }) => {
    const { board } = findy.pages
    await findy.api.seed([{ title: 'Dev' }, { title: 'QA' }])
    for (const text of ['a', 'b']) await findy.api.addNote('Dev', text)
    for (const text of ['a', 'b', 'c', 'd', 'e']) await findy.api.addNote('QA', text)
    await findy.refresh()
    await test.step('1.1: the board and the native menu in Polish', async () => {
      await board.chooseLanguage('Polski')
      await board.verifyLanguage('Polski', 'Dodaj aplikację')
      await board.verifyStageNames([
        'Wysłano',
        'Rozmowa z HR',
        'Zadanie testowe',
        'Rozmowa techniczna',
        'Rozmowa z C-level',
        'Oferta',
        'Odmowa',
      ])
      await expect.poll(() => findy.api.menuLabels()).toContain('Edycja')
    })
    await test.step('1.3: Polish plural forms', async () => {
      await board.verifyCardShows('Dev', ['2 notatki'])
      await board.verifyCardShows('QA', ['5 notatek'])
    })
    await test.step('1.4: kept after a restart', async () => {
      const { board: restarted } = await findy.restart()
      await restarted.verifyLanguage('Polski', 'Dodaj aplikację')
    })
  })

  test('spec 026 NFR-002: Polish fits 800 × 600 on every view', async ({ findy }) => {
    const { analytics, settings } = findy.pages
    await findy.api.seed([{ title: 'Dev' }])
    await findy.api.setLanguage('pl')
    await findy.refresh()
    await findy.api.setWindowSize(800, 600)
    expect(await findy.api.hasHorizontalScroll()).toBe(false)
    await analytics.openTab('Analityka')
    await analytics.verifyFitsWindow()
    expect(await findy.api.hasHorizontalScroll()).toBe(false)
    await settings.open()
    await settings.verifyFitsWindow()
  })

  test.describe('spec 026 US-2: first launch on a Polish system', () => {
    test.use({ systemLocale: 'pl-PL' })

    test('shows the UI in Polish', async ({ findy }) => {
      await findy.pages.board.verifyLanguage('Polski', 'Dodaj aplikację')
      await findy.pages.board.verifyEmptyState('Nie ma jeszcze aplikacji')
    })
  })

  test.describe('US-5.1: first launch on a Ukrainian system', () => {
    test.use({ systemLocale: 'uk-UA' })

    test('shows the UI in Ukrainian', async ({ findy }) => {
      await findy.pages.board.verifyLanguage('Українська', 'Додати заявку')
      await findy.pages.board.verifyEmptyState('Ще немає заявок')
    })
  })
})
