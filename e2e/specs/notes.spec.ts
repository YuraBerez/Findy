import { test } from '../fixtures/app'

test.describe('notes (US-3)', () => {
  test.beforeEach(async ({ findy }) => {
    await findy.api.seed([{ title: 'Backend Engineer', company: 'Globex' }])
    await findy.refresh()
    await findy.pages.board.openCard('Backend Engineer')
  })

  test(
    'US-3.1, 3.2, 3.5: add notes; newest first; the card counts them',
    { tag: '@critical' },
    async ({ findy }) => {
      const { details, board } = findy.pages
      await details.verifyNoNotes()
      await details.addNote('Call with Olena (recruiter)')
      await details.addNote('Salary: 4000\nNext: test task')
      await details.verifyNotes(['Salary: 4000\nNext: test task', 'Call with Olena (recruiter)'])
      await details.close()
      await board.verifyCardShows('Backend Engineer', ['2 notes'])
    },
  )

  test('FR-030: an empty note is not saved', async ({ findy }) => {
    const { details } = findy.pages
    await details.addNote('   ')
    await details.verifyNoteError('Fill in this field.')
    await details.verifyNoNotes()
  })

  test('US-3.3: edit a note; it shows "edited"', async ({ findy }) => {
    const { details } = findy.pages
    await details.addNote('draft')
    await details.editNote('draft', 'final text')
    await details.verifyNotes(['final text'])
    await details.verifyNoteEdited('final text')
  })

  test('US-3.4: delete a note after confirming', async ({ findy }) => {
    const { details } = findy.pages
    await details.addNote('keep')
    await details.addNote('remove')
    await details.deleteNote('remove', 'cancel')
    await details.verifyNotes(['remove', 'keep'])
    await details.deleteNote('remove', 'confirm')
    await details.verifyNotes(['keep'])
  })

  test('notes survive a restart', async ({ findy }) => {
    await findy.pages.details.addNote('persisted')
    const { board, details } = await findy.restart()
    await board.openCard('Backend Engineer')
    await details.verifyNotes(['persisted'])
  })
})
