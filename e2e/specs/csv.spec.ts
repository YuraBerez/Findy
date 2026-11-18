import { expect, test } from '../fixtures/app'

const BOM = '\uFEFF'

// Spec 008: CSV export and import
test.describe('CSV export and import (spec 008)', () => {
  test(
    'US-1 and SC-001: export the board, import it into an empty board, same board',
    { tag: '@critical' },
    async ({ findy }) => {
      const { board, importDialog } = findy.pages
      await findy.api.seed([
        { title: 'Frontend, "senior"', company: 'Acme', url: 'https://acme.com/1' },
        { title: 'Backend', company: 'Globex', stage: 'rejected' },
      ])
      await findy.api.setColor('Backend', 'red')
      await findy.api.addNote('Frontend, "senior"', 'First call\nwent well')
      await findy.api.setHiddenStages(['rejected'])
      await findy.refresh()
      const before = (await findy.api.state()).applications

      await test.step('1.1, 1.2: export writes every application, hidden ones too', async () => {
        await findy.api.answerFileDialogs(findy.files.path('board.csv'))
        await board.exportCsv()
        await board.verifyInfo('Exported 2 applications.')
        const csv = findy.files.read('board.csv')
        expect(csv.startsWith(`${BOM}Title,Company,Link,Stage,Colour,`)).toBe(true)
        expect(csv).toContain('"Frontend, ""senior""",Acme,https://acme.com/1,Applied,,')
        expect(csv).toContain('Backend,Globex,,Rejected,Red,')
      })

      await test.step('import into an empty board gives the same applications', async () => {
        await findy.api.resetBoard()
        await findy.refresh()
        await board.importCsv()
        await importDialog.verifyShown('board.csv', [
          '2 applications will be added.',
          '1 application goes to a hidden column.',
        ])
        await importDialog.confirm('Import 2 applications')
        await board.verifyInfo('Added 2 applications.')
        await board.verifyCards('applied', ['Frontend, "senior"'])
        const after = (await findy.api.state()).applications
        const keep = (list: typeof before) =>
          list.map((app) => ({
            ...app,
            id: undefined,
            updatedAt: undefined,
            notes: app.notes.map(({ text, createdAt }) => ({
              text,
              createdAt: createdAt.slice(0, 19),
            })),
            createdAt: app.createdAt.slice(0, 19),
            stageHistory: app.stageHistory.map((c) => ({ ...c, at: c.at.slice(0, 19) })),
          }))
        expect(keep(after)).toEqual(keep(before))
      })
    },
  )

  test('US-1.3: the file is in the language of the app', async ({ findy }) => {
    await findy.api.seed([{ title: 'Dev', stage: 'offered' }])
    await findy.api.setLanguage('uk')
    await findy.refresh()
    await findy.api.answerFileDialogs(findy.files.path('uk.csv'))
    await findy.pages.board.exportCsv()
    await findy.pages.board.verifyInfo('Експортовано 1 заявку.')
    expect(findy.files.read('uk.csv')).toMatch(/^\uFEFFНазва,Компанія,Посилання,Етап,Колір,/)
    expect(findy.files.read('uk.csv')).toContain('Dev,Acme,,Офер,,')
  })

  test('US-1.5, 1.6: cancel writes nothing; an empty board cannot export', async ({ findy }) => {
    const { board } = findy.pages
    await board.verifyExportDisabled()
    await findy.api.seed([{ title: 'Dev' }])
    await findy.refresh()
    await findy.api.answerFileDialogs(null)
    await board.exportCsv()
    await board.verifyNoNotification()
  })

  test('US-2.1…2.3, 2.6: own table with errors; cancel, then import', async ({ findy }) => {
    const { board, importDialog } = findy.pages
    await findy.api.seed([{ title: 'Old', company: 'Acme' }])
    await findy.refresh()
    const file = findy.files.write(
      'mine.csv',
      'Назва;Компанія\r\nDesigner;Globex\r\n;Initech\r\nold;ACME\r\nQA;Umbrella\r\n',
    )
    await findy.api.answerFileDialogs(file)

    await test.step('2.1: the summary; 2.3: cancel changes nothing', async () => {
      await board.importCsv()
      await importDialog.verifyShown('mine.csv', [
        '2 applications will be added.',
        '1 duplicate will be skipped.',
        '1 row has errors and will be skipped:',
      ])
      await importDialog.verifyErrors(['Row 3, Title: missing value'])
      await importDialog.cancel()
      await board.verifyCards('applied', ['Old'])
    })
    await test.step('2.2, 2.6: confirm adds them on top in file order', async () => {
      await board.importCsv()
      await importDialog.confirm('Import 2 applications')
      await board.verifyCards('applied', ['Designer', 'QA', 'Old'])
    })
    await test.step('2.5: the same file again adds nothing', async () => {
      await board.importCsv()
      await importDialog.verifyShown('mine.csv', [
        'There is nothing new to add.',
        '3 duplicates will be skipped.',
      ])
      await importDialog.verifyOnlyClose()
      await importDialog.close()
    })
  })

  test('US-2.7: a file without the required columns cannot be imported', async ({ findy }) => {
    const file = findy.files.write('people.csv', 'Name,Email\r\nAnna,a@x.com\r\n')
    await findy.api.answerFileDialogs(file)
    await findy.pages.board.importCsv()
    await findy.pages.importDialog.verifyShown('people.csv', [
      'Required columns are missing: Title and Company.',
    ])
    await findy.pages.importDialog.verifyOnlyClose()
  })

  test('US-3.1, 3.2: keyboard only, English file in the Ukrainian app', async ({ findy }) => {
    await findy.api.seed([{ title: 'Old' }])
    await findy.refresh()
    await findy.api.answerFileDialogs(
      findy.files.write('en.csv', 'Title,Company,Stage,Colour\r\nDev,Acme,Offer,Green\r\n'),
    )
    await findy.pages.board.importCsvWithKeyboard()
    await findy.pages.importDialog.confirmWithKeyboard('Import 1 application')
    await findy.pages.board.verifyCards('offered', ['Dev'])
    await findy.pages.board.verifyCardColor('Dev', 'green')

    await findy.api.setLanguage('uk')
    await findy.refresh()
    await findy.api.answerFileDialogs(
      findy.files.write('en2.csv', 'Title,Company,Stage\r\nQA,Acme,Test task\r\n'),
    )
    await findy.pages.board.importCsv()
    await findy.pages.importDialog.confirm('Імпортувати 1 заявку')
    await findy.pages.board.verifyCards('test_task', ['QA'])
  })
})
