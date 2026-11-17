import { test } from '../fixtures/app'

test.describe('search (US-8)', () => {
  test.beforeEach(async ({ findy }) => {
    await findy.api.seed([
      { title: 'Frontend Developer', company: 'Acme' },
      { title: 'QA Engineer', company: 'Initech' },
      { title: 'Acme Platform Lead', company: 'Globex', stage: 'offered' },
      { title: 'Backend Engineer', company: 'Globex', stage: 'hr_interview' },
    ])
    await findy.refresh()
  })

  test(
    'US-8.1 and 8.2: filter every column by title or company, then clear',
    { tag: '@critical' },
    async ({ findy }) => {
      const { board } = findy.pages
      await test.step('8.1: "acm" matches a company and a title, case-insensitive', async () => {
        await board.search('acm')
        await board.verifyCards('applied', ['Frontend Developer'])
        await board.verifyCards('offered', ['Acme Platform Lead'])
        await board.verifyCards('hr_interview', [])
        await board.verifyColumnCount('applied', 1)
      })
      await test.step('8.2: Escape clears the search', async () => {
        await board.clearSearchWithEscape()
        await board.verifySearch('')
        await board.verifyCards('applied', ['Frontend Developer', 'QA Engineer'])
        await board.verifyCards('hr_interview', ['Backend Engineer'])
      })
    },
  )

  test('Cmd/Ctrl+F focuses the search; no matches are explained', async ({ findy }) => {
    const { board } = findy.pages
    await board.focusSearchWithShortcut()
    await board.verifySearch('', true)
    await board.search('nothing like this')
    await board.verifyNoResults('nothing like this')
  })

  test('a drag while filtering keeps the order of the hidden cards', async ({ findy }) => {
    const { board } = findy.pages
    await findy.api.seed([{ title: 'Acme Two', company: 'Acme' }]) // on top: Acme Two, Frontend Developer, QA Engineer
    await findy.refresh()
    await board.search('acme')
    await board.verifyCards('applied', ['Acme Two', 'Frontend Developer'])

    await board.dragCard('Frontend Developer', { before: 'Acme Two', in: 'applied' })
    await board.verifyCards('applied', ['Frontend Developer', 'Acme Two'])

    await board.clearSearchWithEscape()
    await board.verifyCards('applied', ['Frontend Developer', 'Acme Two', 'QA Engineer'])
  })
})
