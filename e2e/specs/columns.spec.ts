import { expect, test } from '../fixtures/app'

const ALL = [
  'Applied',
  'HR interview',
  'Test task',
  'Technical interview',
  'C-level interview',
  'Offer',
  'Rejected',
]
const without = (...hidden: string[]) => ALL.filter((name) => !hidden.includes(name))

test.describe('hidden columns (spec 002)', () => {
  test(
    'US-1 and US-2: hide a column, keep it hidden, show it again',
    { tag: '@critical' },
    async ({ findy }) => {
      await findy.api.seed([{ title: 'Rejected card', stage: 'rejected' }])
      await findy.refresh()

      await test.step('1.1: hide from the column header', async () => {
        await findy.pages.board.hideColumn('rejected', 'Rejected')
        await findy.pages.board.verifyStageNames(without('Rejected'))
      })
      await test.step('1.3: it stays hidden after a restart; FR-004: the card is kept', async () => {
        const { board } = await findy.restart()
        await board.verifyStageNames(without('Rejected'))
        expect((await findy.api.state()).applications.map((item) => item.stage)).toEqual([
          'rejected',
        ])
      })
      await test.step('2.1 and 2.2: the Columns dialog shows it again', async () => {
        const { board, settings } = findy.pages
        await settings.open('Board')
        await settings.verifyColumnSwitch('Rejected', { on: false, count: '1 application' })
        await settings.verifyColumnSwitch('Applied', { on: true, count: '0 applications' })
        await settings.setColumnShown('Rejected')
        await settings.close()
        await board.verifyStageNames(ALL)
        await board.verifyCards('rejected', ['Rejected card'])
      })
    },
  )

  test('US-1.2: the last visible column cannot be hidden', async ({ findy }) => {
    await findy.api.setHiddenStages([
      'hr_interview',
      'test_task',
      'technical_interview',
      'c_level_interview',
      'offered',
      'rejected',
    ])
    await findy.refresh()
    const { board, settings } = findy.pages
    await board.verifyStageNames(['Applied'])
    await board.verifyNoHideButton('applied')
    await settings.open('Board')
    await settings.verifyColumnSwitch('Applied', { on: true, enabled: false })
  })

  test('US-3: no move or choice into a hidden column', async ({ findy }) => {
    await findy.api.setHiddenStages(['test_task'])
    await findy.api.seed([{ title: 'Designer', stage: 'hr_interview' }])
    await findy.refresh()
    const { board, dialog } = findy.pages

    await test.step('3.3: not in the Move to menu', async () => {
      await board.openCardMenu('Designer')
      await board.verifyMenuItems(without('HR interview', 'Test task'))
      await board.pressInMenu('Applied', 'Escape')
    })
    await test.step('3.2: the keyboard skips the hidden column', async () => {
      await board.moveWithKeyboard('Designer', 'hr_interview', [
        { key: 'ArrowRight', reaches: 'technical_interview' },
      ])
      await board.verifyCards('technical_interview', ['Designer'])
    })
    await test.step('3.1: no drop target: the column is not on the board', async () => {
      await board.verifyColumnHidden('test_task')
    })
    await test.step('3.3 and 3.4: forms offer visible stages; default is the first visible', async () => {
      await findy.api.setHiddenStages(['applied', 'test_task'])
      await findy.refresh()
      await board.startAdding()
      await dialog.verifyStageOptions(without('Applied', 'Test task'), 'HR interview')
    })
    await test.step('FR-006: main rejects a move into a hidden stage', async () => {
      expect(await findy.api.tryMove('Designer', 'test_task')).toMatch(/^VALIDATION: /)
    })
  })
})
