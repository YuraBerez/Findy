import { expect, test } from '../fixtures/app'

test.describe('storage', () => {
  test('US-6.1: data persists across restarts', { tag: '@critical' }, async ({ findy }) => {
    await test.step('create, move and annotate an application', async () => {
      await findy.api.seed([{ title: 'Frontend Developer', url: 'https://acme.com/jobs/1' }])
      await findy.refresh()
      await findy.pages.board.moveWithMenu('Frontend Developer', 'HR interview')
      await findy.api.addNote('Frontend Developer', 'Call with the recruiter')
    })
    await test.step('restart the app on the same database', async () => {
      const { board } = await findy.restart()
      await board.verifyCards('hr_interview', ['Frontend Developer'])
      await board.verifyCardShows('Frontend Developer', ['Acme', '1 note'])
    })
    await test.step('the stage history survived too', async () => {
      const [saved] = (await findy.api.state()).applications
      expect(saved!.stageHistory.map((change) => change.stage)).toEqual(['applied', 'hr_interview'])
    })
  })
})

test.describe('storage: a damaged database (US-6.3)', () => {
  test.use({ databaseFile: 'definitely not sqlite' })

  test('is kept, copied aside and explained', async ({ findy }) => {
    await test.step('the app explains the problem', async () => {
      await findy.pages.board.verifyStorageError(['Your data could not be opened', 'findy.db'])
    })
    await test.step('nothing can be saved', async () => {
      expect(await findy.api.tryCreate({ title: 'a', company: 'b' })).toMatch(/^STORAGE: /)
    })
  })
})
