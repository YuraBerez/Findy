import { expect, test, type HistoryApplication } from '../fixtures/app'

// Days are counted back from today (e2e/data/history-database.ts)
const HISTORY: HistoryApplication[] = [
  { title: 'A', createdDaysAgo: 0 },
  { title: 'B', createdDaysAgo: 1, moves: [['hr_interview', 1]] },
  {
    title: 'C',
    createdDaysAgo: 3,
    moves: [
      ['hr_interview', 2],
      ['offered', 0],
    ],
  },
]

const TILES: [string, string][] = [
  ['Days of search', '4'],
  ['Applications sent', '3'],
  ['Interviews', '2'],
  ['Offers', '1'],
]

const FUNNEL = [
  'Applied: 3 (100%)',
  'HR interview: 2 (66.7%)',
  'Test task: 1 (33.3%)',
  'Technical interview: 1 (33.3%)',
  'C-level interview: 1 (33.3%)',
  'Offer: 1 (33.3%)',
]

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

test.describe('share analytics as an image (spec 023)', () => {
  test('FR-002: no button in the empty state', async ({ findy }) => {
    await findy.pages.analytics.openTab('Analytics')
    await findy.pages.analytics.verifyEmpty()
    await findy.pages.shareImage.verifyButtonHidden()
  })

  test.describe('with history', () => {
    test.use({ history: { applications: HISTORY } })

    test('US-1: the image of the period, with the numbers of the screen', async ({ findy }) => {
      const { analytics, shareImage } = findy.pages
      await analytics.openTab('Analytics')

      await test.step('1.1: the button is on the right side of the filters', async () => {
        await shareImage.verifyButtonRightOfFilters()
      })
      await test.step('1.2, 1.6: a square image with the title, tiles and funnel', async () => {
        await shareImage.open()
        await shareImage.verifyImageSize()
        await shareImage.verifyImageText({
          heading: 'Findy · My job search · Last 30 days',
          tiles: TILES,
          funnel: FUNNEL,
        })
      })
      await test.step('1.3: another period gives its own image', async () => {
        await shareImage.close()
        await analytics.selectPeriod('Last 7 days')
        await shareImage.open()
        await shareImage.verifyImageText({
          heading: 'Findy · My job search · Last 7 days',
          tiles: TILES,
          funnel: FUNNEL,
        })
      })
    })

    test('1.4: the image is light in the dark theme', async ({ findy }) => {
      await findy.api.setTheme('dark')
      await findy.refresh()
      await findy.pages.analytics.openTab('Analytics')
      await findy.pages.shareImage.open()
      await findy.pages.shareImage.verifyImageLight()
    })

    test('1.5: the image is in Ukrainian', async ({ findy }) => {
      await findy.api.setLanguage('uk')
      await findy.refresh()
      await findy.pages.analytics.openTab('Аналітика')
      await findy.pages.shareImage.open()
      await findy.pages.shareImage.verifyImageText({
        heading: 'Findy · Мій пошук роботи · Останні 30 днів',
        tiles: [
          ['Днів пошуку', '4'],
          ['Надіслано заявок', '3'],
          ['Співбесіди', '2'],
          ['Офери', '1'],
        ],
        funnel: [
          'Заявку надіслано: 3 (100%)',
          'HR-співбесіда: 2 (66,7%)',
          'Тестове завдання: 1 (33,3%)',
          'Технічна співбесіда: 1 (33,3%)',
          'Співбесіда з C-level: 1 (33,3%)',
          'Офер: 1 (33,3%)',
        ],
      })
    })

    test('US-2: copy, save, cancel, failures and close', async ({ findy }) => {
      const { analytics, board, shareImage } = findy.pages
      await analytics.openTab('Analytics')
      await shareImage.open()

      await test.step('2.1: Copy puts the 1080 × 1080 image on the clipboard', async () => {
        const size = await findy.api.copiedImage(() => shareImage.copy())
        expect(size).toEqual({ width: 1080, height: 1080 })
        await board.verifyInfo('Image copied')
      })
      await test.step('2.2: Save as PNG writes the file', async () => {
        await findy.api.answerFileDialogs(findy.files.path('analytics.png'))
        await shareImage.save()
        await board.verifyInfo('Image saved')
        expect([...findy.files.bytes('analytics.png').subarray(0, 8)]).toEqual(PNG_SIGNATURE)
      })
      await test.step('2.3: a cancel saves nothing and keeps the preview', async () => {
        await findy.api.answerFileDialogs(null)
        await shareImage.save()
        await shareImage.verifyOpen()
        expect(findy.files.exists('cancelled.png')).toBe(false)
      })
      await test.step('2.4: a failed copy shows the error and keeps the preview', async () => {
        await findy.api.breakClipboard()
        await shareImage.copy()
        await board.verifyNotification('Findy could not save this change.')
        await shareImage.verifyOpen()
      })
      await test.step('2.5: Esc closes; focus goes back to the button', async () => {
        await shareImage.pressEscape()
        await shareImage.verifyButtonFocused()
      })
    })

    test('US-3: open, use and close the preview with the keyboard', async ({ findy }) => {
      const { analytics, shareImage } = findy.pages
      await analytics.openTab('Analytics')
      await shareImage.openWithKeyboard()
      await shareImage.verifyFocusInDialog()
      await shareImage.pressEscape()
      await shareImage.verifyButtonFocused()
    })
  })
})
