// Spec 018: one settings window
import { expect, test } from '../fixtures/app'

const CATEGORIES = ['General', 'Board', 'Reminders', 'Updates', 'AI assistant']

test.describe('settings window (spec 018)', () => {
  test(
    'US-1: open from the menu and the native menu; categories; close',
    { tag: '@critical' },
    async ({ findy }) => {
      const { board, settings, details } = findy.pages
      await findy.api.seed([{ title: 'Dev' }])
      await findy.refresh()

      await test.step('US-1.1: ⋯ → Settings… opens on General', async () => {
        await settings.open()
        await settings.verifyOpen('General')
        await settings.verifyCategories(CATEGORIES)
        await settings.verifyPage('General')
      })
      await test.step('US-1.2: a click and ↓ change the category', async () => {
        await settings.chooseCategory('Updates')
        await settings.verifyPage('Updates')
        await settings.nextCategoryWithKeyboard()
        await settings.verifyOpen('AI assistant')
        await settings.verifyPage('AI assistant')
      })
      await test.step('US-1.6: Esc closes', async () => {
        await settings.closeWithEscape()
      })
      await test.step('US-1.4: Settings… in the native menu (Cmd/Ctrl+,)', async () => {
        await findy.api.clickNativeMenuItem('Settings…')
        await board.verifySettingsOpen()
        await settings.close()
      })
      await test.step('US-1.5: nothing while the details panel is open', async () => {
        await board.openCard('Dev')
        await findy.api.clickNativeMenuItem('Settings…')
        await details.verifyOpen('Dev')
        await settings.verifyClosed()
      })
    },
  )

  test('US-2: each category applies at once and keeps its value', async ({ findy }) => {
    const { board, settings, updates } = findy.pages
    await findy.api.seed([{ title: 'Dev', stage: 'rejected' }])
    await findy.refresh()

    await settings.open('Board')
    await settings.verifyColumnSwitch('Rejected', { on: true, count: '1 application' })
    await settings.setColumnShown('Rejected')
    await board.verifyColumnHidden('rejected')
    await settings.chooseCategory('Reminders')
    await settings.setSwitch('Reminders', false)
    await settings.close()
    await updates.setAutoCheck(true)

    const pages = await findy.restart()
    await pages.board.verifyColumnHidden('rejected')
    await pages.settings.open('Reminders')
    await pages.settings.verifySwitch('Reminders', false)
    await pages.settings.chooseCategory('Updates')
    await pages.settings.verifySwitch('Check for updates automatically', true)
    expect((await findy.api.state()).settings).toMatchObject({
      hiddenStages: ['rejected'],
      remindersEnabled: false,
      autoUpdateCheck: true,
    })
  })

  test('US-3: the app menu holds only actions', async ({ findy }) => {
    await findy.api.seed([{ title: 'Dev' }])
    await findy.refresh()
    await findy.pages.board.verifyAppMenu([
      'Settings…',
      'Export to CSV…',
      'Import from CSV…',
      'Check for updates…',
      'Support Findy…',
      'Reset board…',
    ])
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`every category has no violations (${theme})`, { tag: '@a11y' }, async ({ findy }) => {
      await findy.api.setTheme(theme)
      await findy.refresh()
      const { settings, a11y } = findy.pages
      await settings.open()
      for (const category of CATEGORIES) {
        await settings.chooseCategory(category)
        await a11y.expectNoViolations()
      }
    })
  }

  test.describe('in Ukrainian', () => {
    test.use({ systemLocale: 'uk-UA' })

    test('NFR-001, NFR-003: names in Ukrainian; the window fits 800 × 600', async ({ findy }) => {
      await findy.api.setWindowSize(800, 600)
      const { settings } = findy.pages
      await settings.open()
      await settings.verifyCategories([
        'Загальні',
        'Дошка',
        'Нагадування',
        'Оновлення',
        'AI-асистент',
      ])
      await settings.verifyFitsWindow()
      expect(await findy.api.hasHorizontalScroll()).toBe(false)
    })
  })
})
