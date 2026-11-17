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
})
