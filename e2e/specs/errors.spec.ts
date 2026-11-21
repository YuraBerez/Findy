import { test } from '../fixtures/app'

test.describe('error handling (spec 003)', () => {
  test('US-1.3: acting on a deleted application explains it and shows the saved board', async ({
    findy,
  }) => {
    const { board } = findy.pages
    await findy.api.seed([{ title: 'Ghost' }, { title: 'Real' }])
    await findy.refresh()
    await findy.api.deleteApplication('Ghost') // e.g. deleted in another window

    await board.moveWithMenu('Ghost', 'Offer')
    await board.verifyNotification(
      'This item no longer exists. The board now shows the saved data.',
    )
    await board.verifyCards('applied', ['Real'])
    await board.verifyCards('offered', [])
  })

  test(
    'US-1.1, 1.2 and US-2: a failed save keeps the dialog and the input',
    { tag: '@critical' },
    async ({ findy }) => {
      const { board, dialog } = findy.pages
      await findy.api.failInMain('createApplication', 'STORAGE')

      await board.startAdding()
      await dialog.fill({ title: 'Frontend Developer', company: 'Acme' })
      await dialog.submit()

      await board.verifyNotification(
        'Findy could not save this change. Your saved data did not change.',
      )
      await dialog.verifyOpen()
      await dialog.verifyValue('title', 'Frontend Developer')
      await dialog.cancel()
      await board.closeNotification('Findy could not save this change')
      await board.verifyNoNotification()
    },
  )

  test('FR-005: an unhandled rejection is shown too', async ({ findy, errorGuard }) => {
    errorGuard.expect({
      kind: 'pageerror',
      message: 'boom',
      reason: 'Spec 003 FR-005: rejection on purpose',
    })
    await findy.api.rejectUnhandled('boom')
    await findy.pages.board.verifyNotification('Something went wrong.')
  })

  test('a notification has no accessibility violations', { tag: '@a11y' }, async ({ findy }) => {
    await findy.api.failInMain('setTheme', 'STORAGE')
    await findy.pages.board.chooseTheme('Dark')
    await findy.pages.board.verifyNotification('Findy could not save this change.')
    await findy.pages.a11y.expectNoViolations()
  })
})
