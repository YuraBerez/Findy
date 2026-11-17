import { test } from '../fixtures/app'

test.describe('add an application (US-1)', () => {
  test('the empty board offers to add the first application', async ({ findy }) => {
    const { board, dialog } = findy.pages
    await board.verifyEmptyState('No applications yet')
    await board.startAddingFromEmptyState()
    await dialog.verifyOpen()
  })

  test(
    'US-1.1: a new application appears on top of Applied',
    { tag: '@critical' },
    async ({ findy }) => {
      const { board, applications } = findy.pages
      await test.step('one application exists', async () => {
        await findy.api.seed([{ title: 'Older', company: 'Globex' }])
        await findy.refresh()
      })
      await test.step('add a new one', async () => {
        await applications.add(
          { title: 'Frontend Developer', company: 'Acme', url: 'https://acme.com/jobs/1' },
          'applied',
          ['Frontend Developer', 'Older'],
        )
      })
      await test.step('the card shows its details and the count is updated', async () => {
        await board.verifyCardShows('Frontend Developer', ['Acme', '0 notes'])
        await board.verifyColumnCount('applied', 2)
        await board.verifyNoEmptyState()
      })
    },
  )

  test('US-1.2: empty required fields block submit', async ({ findy }) => {
    const { dialog, applications, board } = findy.pages
    await test.step('submit an empty form', async () => {
      await applications.submitRejected({})
      await dialog.verifyInvalid('title', 'Fill in this field.')
      await dialog.verifyInvalid('company', 'Fill in this field.')
      await dialog.verifyFocused('title')
      await board.verifyCards('applied', [])
    })
    await test.step('typing clears the error of that field', async () => {
      await dialog.fill({ title: 'Dev' })
      await dialog.verifyValid('title')
    })
  })

  test('US-1.3: an invalid URL shows a validation error', async ({ findy }) => {
    const { dialog, applications, board } = findy.pages
    await applications.submitRejected({ title: 'Dev', company: 'Acme', url: 'acme jobs' })
    await dialog.verifyInvalid('url', 'Enter a link that starts with http:// or https://.')
    await board.verifyCards('applied', [])
  })

  test('US-1.4 and 1.5: the URL is optional and the stage can be chosen', async ({ findy }) => {
    const { applications, board } = findy.pages
    await applications.add(
      { title: 'QA Engineer', company: 'Initech', stage: 'Test task' },
      'test_task',
      ['QA Engineer'],
    )
    await board.verifyCards('applied', [])
  })

  test('Esc, ×, a click outside and Cancel close the dialog without saving', async ({ findy }) => {
    const { board, dialog } = findy.pages
    await test.step('Escape', async () => {
      await board.startAdding()
      await dialog.fill({ title: 'Draft' })
      await dialog.dismissWithEscape()
      await dialog.verifyClosed()
    })
    await test.step('the × and a click outside close it too', async () => {
      await board.startAdding()
      await dialog.closeWithCross()
      await dialog.verifyClosed()
      await board.startAdding()
      await dialog.closeByClickingOutside()
      await dialog.verifyClosed()
    })
    await test.step('Cancel, and the form starts empty again', async () => {
      await board.startAdding()
      await dialog.verifyEmpty()
      await dialog.cancel()
      await dialog.verifyClosed()
      await board.verifyCards('applied', [])
    })
  })
})
