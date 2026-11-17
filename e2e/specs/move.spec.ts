import { expect, test } from '../fixtures/app'

const ALL_STAGES = [
  'Applied',
  'HR interview',
  'Test task',
  'Technical interview',
  'C-level interview',
  'Offer',
  'Rejected',
]

test.describe('move applications (US-2)', () => {
  test(
    'US-2.1 and 2.4: drag a card to another stage; history records it',
    { tag: '@critical' },
    async ({ findy }) => {
      const { board } = findy.pages
      await findy.api.seed([{ title: 'Frontend Developer' }])
      await findy.refresh()

      await test.step('drag Applied → HR interview', async () => {
        await board.dragCard('Frontend Developer', { stage: 'hr_interview' })
        await board.verifyCards('hr_interview', ['Frontend Developer'])
        await board.verifyCards('applied', [])
      })
      await test.step('the stage change is in the history', async () => {
        const [saved] = (await findy.api.state()).applications
        expect(saved!.stageHistory.map((change) => change.stage)).toEqual([
          'applied',
          'hr_interview',
        ])
      })
    },
  )

  test('FR-020: cards move backwards too, by drag, menu and keyboard', async ({ findy }) => {
    const { board } = findy.pages
    await findy.api.seed([
      { title: 'Test card', stage: 'test_task' },
      { title: 'Rejected card', stage: 'rejected' },
    ])
    await findy.refresh()

    await test.step('drag Test task → Applied', async () => {
      await board.dragCard('Test card', { stage: 'applied' })
      await board.verifyCards('applied', ['Test card'])
      await board.verifyCards('test_task', [])
    })
    await test.step('menu: Rejected → HR interview', async () => {
      await board.moveWithMenu('Rejected card', 'HR interview')
      await board.verifyCards('hr_interview', ['Rejected card'])
    })
    await test.step('keyboard: HR interview → Applied', async () => {
      await board.moveWithKeyboard('Rejected card', 'hr_interview', [
        { key: 'ArrowLeft', reaches: 'applied' },
      ])
      await board.verifyCards('hr_interview', [])
      await board.verifyCardFocused('applied', 'Rejected card')
    })
  })

  test('US-2.2: the Move to… menu lists the other stages and moves the card', async ({ findy }) => {
    const { board } = findy.pages
    await findy.api.seed([{ title: 'Backend Engineer' }])
    await findy.refresh()

    await board.openCardMenu('Backend Engineer')
    await board.verifyMenuItems(ALL_STAGES.filter((stage) => stage !== 'Applied'))
    await board.pressInMenu('HR interview', 'Escape')
    await board.moveWithMenu('Backend Engineer', 'Rejected')
    await board.verifyCards('rejected', ['Backend Engineer'])
    await board.verifyMenuClosed()
  })

  test('US-2.2 (keyboard): the menu works without a mouse and keeps focus', async ({ findy }) => {
    const { board } = findy.pages
    await findy.api.seed([{ title: 'QA Engineer' }])
    await findy.refresh()

    await test.step('open with Enter, move with arrows, pick with Enter', async () => {
      await board.openCardMenuWithKeyboard('QA Engineer')
      await board.verifyMenuItemFocused('HR interview')
      await board.pressInMenu('HR interview', 'ArrowDown')
      await board.verifyMenuItemFocused('Test task')
      await board.pressInMenu('Test task', 'Enter')
    })
    await test.step('the card moved and has focus in its new column', async () => {
      await board.verifyCards('test_task', ['QA Engineer'])
      await board.verifyCardFocused('test_task', 'QA Engineer')
    })
    await test.step('Escape closes the menu and returns focus', async () => {
      await board.openCardMenu('QA Engineer')
      await board.pressInMenu('Applied', 'Escape')
      await board.verifyMenuClosed()
      await board.verifyCardMenuFocused('QA Engineer')
    })
  })

  test('US-2.3: reordering within a column persists after restart', async ({ findy }) => {
    await findy.api.seed([{ title: 'A' }, { title: 'B' }, { title: 'C' }])
    await findy.refresh()

    await test.step('drag C above A', async () => {
      await findy.pages.board.verifyCards('applied', ['A', 'B', 'C'])
      await findy.pages.board.dragCard('C', { before: 'A', in: 'applied' })
      await findy.pages.board.verifyCards('applied', ['C', 'A', 'B'])
    })
    await test.step('the order survives a restart, with no new history', async () => {
      const { board } = await findy.restart()
      await board.verifyCards('applied', ['C', 'A', 'B'])
      const state = await findy.api.state()
      expect(state.applications.find((item) => item.title === 'C')!.stageHistory).toHaveLength(1)
    })
  })

  test('FR-021: drag with the keyboard across two columns', async ({ findy }) => {
    const { board } = findy.pages
    await findy.api.seed([{ title: 'Designer' }])
    await findy.refresh()

    await board.moveWithKeyboard('Designer', 'applied', [
      { key: 'ArrowRight', reaches: 'hr_interview' },
      { key: 'ArrowRight', reaches: 'test_task' },
    ])
    await board.verifyCards('test_task', ['Designer'])
    await board.verifyCardFocused('test_task', 'Designer')
  })
})
