import { expect, test } from '../fixtures/app'

test.describe('app shell', () => {
  test('opens with a secure renderer (NFR-004)', { tag: '@critical' }, async ({ findy }) => {
    const { board } = findy.pages
    await test.step('the window shows the board', async () => {
      await board.verifyShown()
    })
    await test.step('the renderer has no Node.js and cannot open windows', async () => {
      expect(await findy.api.rendererHasRequire()).toBe(false)
      expect(await findy.api.windowOpenWorks()).toBe(false)
    })
  })

  test('rejects invalid IPC input with a validation error', async ({ findy }) => {
    expect(await findy.api.tryCreate({ title: '', company: 'x' })).toMatch(/VALIDATION: /)
  })

  test('shows all seven stages in order (FR-001, FR-002)', async ({ findy }) => {
    await findy.pages.board.verifyStageNames([
      'Applied',
      'HR interview',
      'Test task',
      'Technical interview',
      'C-level interview',
      'Offer',
      'Rejected',
    ])
  })
})
