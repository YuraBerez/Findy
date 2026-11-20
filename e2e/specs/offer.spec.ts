import { expect, test } from '../fixtures/app'
import { NEW_ISSUE_URL, PROJECT_URL, SUPPORT_URL } from '../../src/shared/project'

test.describe('congratulate on an offer (spec 013)', () => {
  test(
    'US-1.1, 1.2, 1.5: a drag to Offer asks; Yes leads to Ko-fi; never asked again',
    { tag: '@critical' },
    async ({ findy }) => {
      const { board, offerDialog } = findy.pages
      await findy.api.seed([
        { title: 'Frontend Developer', stage: 'technical_interview' },
        { title: 'QA Engineer', stage: 'hr_interview' },
      ])
      // Fewer columns, so Offer is on screen for the drag
      await findy.api.setHiddenStages(['test_task', 'c_level_interview'])
      await findy.refresh()
      await findy.api.captureExternalLinks()

      await test.step('1.1, 1.6: the move is saved and the question shows', async () => {
        await board.dragCard('Frontend Developer', { stage: 'offered' })
        await offerDialog.verifyAsked()
        await board.verifyCards('offered', ['Frontend Developer'])
      })
      await test.step('1.2: Yes → Ko-fi and a GitHub star; Ko-fi opens', async () => {
        await offerDialog.answer('Yes')
        await offerDialog.verifyStep('Thank you!', ['Support on Ko-fi', 'Star on GitHub'])
        await offerDialog.open('Support on Ko-fi')
        await offerDialog.verifyNoDialog()
        expect(await findy.api.openedLinks()).toEqual([SUPPORT_URL])
      })
      await test.step('1.5, NFR-002: never again, also after a restart', async () => {
        const { board: again, offerDialog: dialog } = await findy.restart()
        await again.dragCard('QA Engineer', { stage: 'offered' })
        await again.verifyCardsInclude('offered', 'QA Engineer')
        await dialog.verifyNoDialog()
      })
    },
  )

  test('US-1.4, FR-009: keyboard; Escape and Not now ask again on the next offer', async ({
    findy,
  }) => {
    const { board, offerDialog } = findy.pages
    await findy.api.seed([
      { title: 'Backend Engineer', stage: 'c_level_interview' },
      { title: 'Data Analyst', stage: 'applied' },
    ])
    await findy.refresh()

    await test.step('a keyboard move asks; Escape closes and returns the focus', async () => {
      await board.moveWithKeyboard('Backend Engineer', 'c_level_interview', [
        { key: 'ArrowRight', reaches: 'offered' },
      ])
      await offerDialog.verifyAsked()
      await offerDialog.closeWithEscape()
      await offerDialog.verifyNoDialog()
      await board.verifyCardFocused('offered', 'Backend Engineer')
    })
    await test.step('the next move to Offer asks again; Not now closes', async () => {
      await board.moveWithMenu('Data Analyst', 'Offer')
      await offerDialog.verifyAsked()
      await offerDialog.answer('Not now')
      await offerDialog.verifyNoDialog()
    })
  })

  test('US-1.3: Not really leads to the feedback page, then never again', async ({ findy }) => {
    const { board, offerDialog } = findy.pages
    await findy.api.seed([
      { title: 'Designer', stage: 'applied' },
      { title: 'Writer', stage: 'applied' },
    ])
    await findy.refresh()
    await findy.api.captureExternalLinks()

    await board.moveWithMenu('Designer', 'Offer')
    await offerDialog.answer('Not really')
    await offerDialog.verifyStep('Thanks for your answer', ['Tell us what to improve'])
    await offerDialog.open('Tell us what to improve')
    expect(await findy.api.openedLinks()).toEqual([NEW_ISSUE_URL])
    await board.moveWithMenu('Writer', 'Offer')
    await board.verifyCards('offered', ['Writer', 'Designer'])
    await offerDialog.verifyNoDialog()
  })

  test("FR-004: Don't ask again ends the question", async ({ findy }) => {
    const { board, offerDialog } = findy.pages
    await findy.api.seed([
      { title: 'One', stage: 'applied' },
      { title: 'Two', stage: 'applied' },
    ])
    await findy.refresh()

    await board.moveWithMenu('One', 'Offer')
    await offerDialog.answer("Don't ask again")
    await offerDialog.verifyNoDialog()
    await board.moveWithMenu('Two', 'Offer')
    await board.verifyCards('offered', ['Two', 'One'])
    await offerDialog.verifyNoDialog()
    expect((await findy.api.state()).settings.offerQuestionAnswered).toBe(true)
  })

  test('US-1.2: Star on GitHub opens the project page', async ({ findy }) => {
    const { board, offerDialog } = findy.pages
    await findy.api.seed([{ title: 'Tester', stage: 'applied' }])
    await findy.refresh()
    await findy.api.captureExternalLinks()

    await board.moveWithMenu('Tester', 'Offer')
    await offerDialog.answer('Yes')
    await offerDialog.open('Star on GitHub')
    await offerDialog.verifyNoDialog()
    expect(await findy.api.openedLinks()).toEqual([PROJECT_URL])
  })

  test('plan D-3: a move in the details panel asks when the panel closes', async ({ findy }) => {
    const { board, details, offerDialog } = findy.pages
    await findy.api.seed([{ title: 'Product Manager', stage: 'technical_interview' }])
    await findy.refresh()

    await board.openCard('Product Manager')
    await details.edit({ stage: 'Offer' })
    await details.verifySaved()
    await offerDialog.verifyNoDialog()
    await details.close()
    await offerDialog.verifyAsked()
  })

  test('FR-002: a CSV import or an AI assistant never asks', async ({ findy }) => {
    const { board, importDialog, offerDialog } = findy.pages
    await findy.api.seed([{ title: 'Mobile Developer', stage: 'technical_interview' }])
    await findy.refresh()

    await test.step('an application imported in Offer', async () => {
      const file = findy.files.write(
        'offer.csv',
        'Title;Company;Stage\r\nDesigner;Globex;Offer\r\n',
      )
      await findy.api.answerFileDialogs(file)
      await board.importCsv()
      await importDialog.confirm('Import 1 application')
      await board.verifyCards('offered', ['Designer'])
      await offerDialog.verifyNoDialog()
    })
    await test.step('a move to Offer from MCP', async () => {
      await findy.api.setMcpEnabled(true)
      const mcp = await findy.connectMcp()
      const id = (await findy.api.state()).applications.find(
        (application) => application.title === 'Mobile Developer',
      )!.id
      expect((await mcp.call('move_application', { id, stage: 'offered' })).isError).toBe(false)
      await expect(async () =>
        board.verifyCards('offered', ['Mobile Developer', 'Designer']),
      ).toPass({ timeout: 2_500 })
      await offerDialog.verifyNoDialog()
    })
  })

  test('US-2.1: app menu → Support Findy… opens Ko-fi', async ({ findy }) => {
    await findy.api.captureExternalLinks()
    await findy.pages.board.supportFindy()
    await expect.poll(() => findy.api.openedLinks()).toEqual([SUPPORT_URL])
  })

  test(
    'the dialog has no violations in both themes; it fits 800 × 600 in Ukrainian',
    {
      tag: '@a11y',
    },
    async ({ findy }) => {
      const { board, offerDialog, a11y } = findy.pages
      await findy.api.seed([
        { title: 'One', stage: 'applied' },
        { title: 'Two', stage: 'applied' },
      ])
      await findy.refresh()
      await board.moveWithMenu('One', 'Offer')
      await offerDialog.verifyAsked()
      await a11y.expectNoViolations()
      await offerDialog.answer('Not now')

      await findy.api.setTheme('dark')
      await findy.api.setLanguage('uk')
      await findy.api.setWindowSize(800, 600)
      await findy.refresh()
      await board.moveWithMenu('Two', 'Офер')
      await offerDialog.verifyButtonsInWindow()
      await a11y.expectNoViolations()
    },
  )
})
