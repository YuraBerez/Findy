import { test } from '../fixtures/app'

// Constitution §VIII: WCAG 2.1 A/AA in both themes and both languages
test.describe('accessibility', () => {
  for (const theme of ['light', 'dark'] as const) {
    test(`board with cards has no violations (${theme})`, { tag: '@a11y' }, async ({ findy }) => {
      await findy.api.setTheme(theme)
      await findy.api.seed([
        { title: 'Frontend Developer', company: 'Acme' },
        { title: 'Backend Engineer', company: 'Globex', stage: 'hr_interview' },
      ])
      await findy.refresh()
      await findy.pages.board.verifyTheme(theme)
      await findy.pages.a11y.expectNoViolations()
    })

    test(`dialog with errors has no violations (${theme})`, { tag: '@a11y' }, async ({ findy }) => {
      await findy.api.setTheme(theme)
      await findy.refresh()
      await findy.pages.applications.submitRejected({ url: 'not a link' })
      await findy.pages.a11y.expectNoViolations()
    })
  }

  test('details with notes has no violations', { tag: '@a11y' }, async ({ findy }) => {
    await findy.api.seed([{ title: 'Frontend Developer', url: 'https://acme.com' }])
    await findy.api.addNote('Frontend Developer', 'First call done')
    await findy.refresh()
    await findy.pages.board.openCard('Frontend Developer')
    await findy.pages.details.verifyOpen('Frontend Developer')
    await findy.pages.a11y.expectNoViolations()
  })

  test('reset confirmation has no violations', { tag: '@a11y' }, async ({ findy }) => {
    await findy.api.seed([{ title: 'A' }])
    await findy.refresh()
    await findy.pages.board.startReset()
    await findy.pages.board.verifyResetConfirmation('1 application will be deleted')
    await findy.pages.a11y.expectNoViolations()
  })

  test('columns dialog has no violations', { tag: '@a11y' }, async ({ findy }) => {
    await findy.api.setHiddenStages(['rejected'])
    await findy.refresh()
    await findy.pages.board.openColumnsDialog()
    await findy.pages.a11y.expectNoViolations()
  })

  test('empty board in Ukrainian has no violations', { tag: '@a11y' }, async ({ findy }) => {
    await findy.api.setLanguage('uk')
    await findy.refresh()
    await findy.pages.a11y.expectNoViolations()
  })

  // Spec 005 NFR-002: the analytics screen with charts, legend, funnel and a table
  test.describe('analytics', () => {
    test.use({
      history: {
        applications: [
          { title: 'A', createdDaysAgo: 0, moves: [['hr_interview', 0]] },
          {
            title: 'B',
            createdDaysAgo: 2,
            moves: [
              ['technical_interview', 1],
              ['rejected', 0],
            ],
          },
        ],
      },
    })

    for (const theme of ['light', 'dark'] as const) {
      test(`analytics has no violations (${theme})`, { tag: '@a11y' }, async ({ findy }) => {
        await findy.api.setTheme(theme)
        await findy.refresh()
        await findy.pages.analytics.openTab('Analytics')
        await findy.pages.analytics.readBarWithKeyboard(
          'Applications sent',
          ['End'],
          /: 1 application$/,
        )
        await findy.pages.a11y.expectNoViolations()
      })
    }

    test('analytics in Ukrainian has no violations', { tag: '@a11y' }, async ({ findy }) => {
      await findy.api.setLanguage('uk')
      await findy.refresh()
      await findy.pages.analytics.openTab('Аналітика')
      await findy.pages.analytics.verifyFunnelStepCount(6)
      await findy.pages.a11y.expectNoViolations()
    })
  })

  test('empty analytics has no violations', { tag: '@a11y' }, async ({ findy }) => {
    await findy.pages.analytics.openTab('Analytics')
    await findy.pages.analytics.verifyEmpty()
    await findy.pages.a11y.expectNoViolations()
  })
})
