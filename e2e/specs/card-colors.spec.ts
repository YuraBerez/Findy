import { expect, test } from '../fixtures/app'

const OPTIONS = ['None', 'Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 'Grey']

// Spec 007: card colours
test.describe('card colours (spec 007)', () => {
  test(
    'US-1: colour a card from its menu, keep it after a restart, remove it',
    { tag: '@critical' },
    async ({ findy }) => {
      await findy.api.seed([{ title: 'Frontend Developer' }])
      await findy.refresh()

      await test.step('1.1 and 1.2: "Colour" shows None, its panel lists the palette', async () => {
        await findy.pages.board.verifyCardColor('Frontend Developer', null)
        await findy.pages.board.verifyColorMenu('Frontend Developer', 'None', OPTIONS)
      })
      await test.step('1.3: a colour shows at once; FR-010: and is in the name', async () => {
        await findy.pages.board.colorWithMenu('Frontend Developer', 'Green')
        await findy.pages.board.verifyCardColor('Frontend Developer', 'green', 'Colour: Green')
        await findy.pages.board.verifyColorMenu('Frontend Developer', 'Green', OPTIONS)
      })
      await test.step('1.5: it stays after a restart', async () => {
        const { board } = await findy.restart()
        await board.verifyCardColor('Frontend Developer', 'green', 'Colour: Green')
      })
      await test.step('1.4: None removes it', async () => {
        await findy.pages.board.colorWithMenu('Frontend Developer', 'None')
        await findy.pages.board.verifyCardColor('Frontend Developer', null)
      })
    },
  )

  test('US-1.6: the colour menu works with the keyboard only', async ({ findy }) => {
    const { board } = findy.pages
    await findy.api.seed([{ title: 'QA Engineer' }])
    await findy.refresh()

    await board.colorWithKeyboard('QA Engineer', ['None', 'Red', 'Orange'])
    await board.verifyCardColor('QA Engineer', 'orange', 'Colour: Orange')
    await board.verifyCardMenuFocused('QA Engineer')
  })

  test('US-2: the details panel shows and changes the colour', async ({ findy }) => {
    const { board, details } = findy.pages
    await findy.api.seed([{ title: 'Backend Engineer' }])
    await findy.api.setColor('Backend Engineer', 'blue')
    await findy.refresh()

    await board.openCard('Backend Engineer')
    await details.verifyColor('Blue')
    await details.chooseColor('Purple')
    await details.verifyColor('Purple')
    await board.verifyCardColor('Backend Engineer', 'purple')
    await test.step('a colour set elsewhere shows when the panel opens again', async () => {
      await findy.api.setColor('Backend Engineer', 'red')
      await findy.refresh()
      await board.openCard('Backend Engineer')
      await details.verifyColor('Red')
    })
  })

  test('US-3: the colour stays on move and edit; FR-008: no history entry', async ({ findy }) => {
    const { board, details } = findy.pages
    await findy.api.seed([{ title: 'Designer' }])
    await findy.api.setColor('Designer', 'yellow')
    await findy.refresh()

    await test.step('3.1: move with the menu', async () => {
      await board.moveWithMenu('Designer', 'HR interview')
      await board.verifyCards('hr_interview', ['Designer'])
      await board.verifyCardColor('Designer', 'yellow')
    })
    await test.step('3.2: edit the title', async () => {
      await board.openCard('Designer')
      await details.edit({ title: 'Lead Designer' })
      await details.verifySaved()
      await details.close()
      await board.verifyCardColor('Lead Designer', 'yellow')
    })
    await test.step('history has only the stage change', async () => {
      const [saved] = (await findy.api.state()).applications
      expect(saved!.stageHistory.map((change) => change.stage)).toEqual(['applied', 'hr_interview'])
    })
    await test.step('3.3: a new application has no colour', async () => {
      await findy.pages.applications.add({ title: 'Data Engineer', company: 'Globex' }, 'applied', [
        'Data Engineer',
      ])
      await board.verifyCardColor('Data Engineer', null)
    })
  })
})
