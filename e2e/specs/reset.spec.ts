import { expect, test } from '../fixtures/app'

test.describe('reset the board (US-10)', () => {
  test('US-10.5: Reset is disabled on an empty board', async ({ findy }) => {
    await findy.pages.board.verifyResetDisabled()
  })

  test(
    'US-10.1–10.4: confirm with a count, backup, settings kept',
    { tag: '@critical' },
    async ({ findy }) => {
      const { board } = findy.pages
      await findy.api.setTheme('dark')
      await findy.api.seed([{ title: 'A' }, { title: 'B', stage: 'offered' }])
      await findy.api.addNote('A', 'note')
      await findy.refresh()

      await test.step('10.1: the confirmation names the count', async () => {
        await board.startReset()
        await board.verifyResetConfirmation('2 applications will be deleted')
      })
      await test.step('10.2: Cancel changes nothing', async () => {
        await board.resetBoard('cancel')
        await board.verifyCards('applied', ['A'])
        await board.verifyCards('offered', ['B'])
        expect(findy.dataFiles().some((name) => name.startsWith('findy.backup-reset-'))).toBe(false)
      })
      await test.step('10.3: confirm empties the board', async () => {
        await board.resetBoard('confirm')
        await board.verifyEmptyState('No applications yet')
        expect((await findy.api.state()).applications).toEqual([])
      })
      await test.step('10.4: a backup was saved, the theme stayed', async () => {
        expect(findy.dataFiles().some((name) => name.startsWith('findy.backup-reset-'))).toBe(true)
        await board.verifyTheme('dark')
      })
    },
  )
})
