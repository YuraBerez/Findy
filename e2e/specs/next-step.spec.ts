// Spec 015: next step and reminders
import { addDays, dateKey } from '../../src/domain/nextStep'
import { expect, test } from '../fixtures/app'

const today = () => dateKey(new Date())
const inDays = (days: number) => addDays(today(), days)
const pad = (value: number) => String(value).padStart(2, '0')

/** A step whose time is `minutes` from now (whole minutes, so 14–15 minutes for 15) */
function stepIn(minutes: number, text: string) {
  const at = new Date(Date.now() + minutes * 60_000)
  return { text, date: dateKey(at), time: `${pad(at.getHours())}:${pad(at.getMinutes())}` }
}

test.describe('next step (spec 015)', () => {
  test(
    'US-1, US-3: add, validate, edit, finish and remove a step',
    { tag: '@critical' },
    async ({ findy }) => {
      const { board, details } = findy.pages
      await findy.api.seed([{ title: 'Dev', company: 'Acme' }])
      await findy.refresh()
      await board.verifyStepMark('Dev', null)
      await board.openCard('Dev')

      await test.step('US-1.3: no text and no date is not saved', async () => {
        await details.addNextStep({})
        await details.verifyStepError('text', 'Fill in this field.')
        await details.verifyStepError('date', 'Fill in this field.')
      })

      await test.step('US-1.1: a step with a date and a time', async () => {
        await details.fillNextStep({
          text: 'Technical interview with Oleh',
          date: inDays(5),
          time: '15:00',
        })
        await details.verifyNextStep('Technical interview with Oleh', /3:00\sPM/)
        await board.verifyStepMark('Dev', /, 3:00\sPM$/)
      })

      await test.step('US-1.2: edit the date; FR-011: a past date is allowed', async () => {
        await details.editNextStep({ date: inDays(-2), time: '' })
        await details.verifyNextStep('Technical interview with Oleh', /Overdue/)
        await board.verifyStepMark('Dev', /^Overdue · /)
        await board.verifyStepOverdue('Dev')
      })

      await test.step('US-3: "Done" turns the step into a note', async () => {
        await details.completeNextStep()
        await details.verifyNoNextStep()
        await details.verifyNotes([/^Done: Technical interview with Oleh \(/])
        await board.verifyStepMark('Dev', null)
      })

      await test.step('US-1.4: "Remove step" adds no note', async () => {
        await details.addNextStep({ text: 'Send the CV', date: inDays(1) })
        await details.removeNextStep()
        await details.verifyNoNextStep()
        await details.verifyNotes([/^Done: /])
      })
    },
  )

  test('US-2: marks for today, tomorrow, later, overdue; none in Rejected', async ({ findy }) => {
    const { board, details } = findy.pages
    await findy.api.seed([
      { title: 'Today', nextStep: { text: 'Call', date: today() } },
      { title: 'Tomorrow', nextStep: { text: 'HR call', date: inDays(1), time: '11:00' } },
      { title: 'Later', nextStep: { text: 'Test task due', date: inDays(5) } },
      { title: 'Overdue', nextStep: { text: 'Follow up', date: inDays(-1) } },
      { title: 'No', stage: 'rejected', nextStep: { text: 'Ask for feedback', date: today() } },
    ])
    await findy.refresh()
    await board.verifyStepMark('Today', /^Today$/)
    await board.verifyStepMark('Tomorrow', /^Tomorrow, 11:00\sAM$/)
    await board.verifyStepMark(
      'Later',
      new RegExp(
        `^${new Intl.DateTimeFormat('en', { weekday: 'short', day: 'numeric', month: 'short', ...(inDays(5).slice(0, 4) === today().slice(0, 4) ? {} : { year: 'numeric' }) }).format(new Date(`${inDays(5)}T00:00`))}$`,
      ),
    )
    await board.verifyStepMark('Overdue', /^Overdue · /)
    await board.verifyStepOverdue('Overdue')
    await board.verifyStepInName('Tomorrow', /Next step: HR call, .+ \(Tomorrow, 11:00\sAM\)/)
    await test.step('US-2.5: the step stays in the details of a rejected card', async () => {
      await board.verifyStepMark('No', null)
      await board.openCard('No')
      await details.verifyNextStep('Ask for feedback', /Today/)
    })
  })

  test('US-2.4: "Tomorrow" becomes "Today" after midnight without a restart', async ({ findy }) => {
    const { board } = findy.pages
    await findy.api.seed([{ title: 'Dev', nextStep: { text: 'Call', date: inDays(1) } }])
    await findy.api.installClock()
    await findy.refresh()
    await board.verifyStepMark('Dev', /^Tomorrow$/)
    await findy.api.advanceClock(24 * 60 * 60 * 1000)
    await board.verifyStepMark('Dev', /^Today$/)
  })

  test('FR-013, FR-024: the card menu opens the step; with the stale mark', async ({ findy }) => {
    const { board, details } = findy.pages
    await findy.api.seed([
      { title: 'No step' },
      { title: 'Has step', nextStep: { text: 'Call', date: inDays(2) } },
    ])
    await findy.refresh()
    await board.openStepFromMenu('No step')
    await details.verifyStepFocused('form')
    await details.close()
    await board.openStepFromMenu('Has step')
    await details.verifyStepFocused('edit')
  })

  test('US-4: reminders 15 and 1 minute before; a click opens the details; off', async ({
    findy,
  }) => {
    const { board, details, settings } = findy.pages
    await findy.api.seed([{ title: 'Dev', company: 'Acme' }, { title: 'Other' }])
    await findy.refresh()
    await findy.api.recordNotifications()

    await test.step('US-4.2: "In 15 min" with the job title and the company', async () => {
      await findy.api.setNextStep('Dev', stepIn(15, 'HR call'))
      await expect
        .poll(() => findy.api.notifications())
        .toEqual([{ title: 'In 15 min: HR call', body: expect.stringMatching(/^Dev · Acme, at /) }])
    })

    await test.step('US-4.3: a click opens the details of that application', async () => {
      await findy.api.clickNotification(0)
      await details.verifyOpen('Dev')
      await details.close()
    })

    await test.step('US-4.2: "In 1 min"', async () => {
      await findy.api.setNextStep('Other', stepIn(1, 'Final call'))
      await expect
        .poll(async () => (await findy.api.notifications()).map((notice) => notice.title))
        .toContain('In 1 min: Final call')
    })

    await test.step('US-4.3: Reminders off → no notification; the marks stay', async () => {
      await settings.open('Reminders')
      await settings.setSwitch('Reminders', false)
      await settings.close()
      const before = (await findy.api.notifications()).length
      await findy.api.setNextStep('Dev', stepIn(15, 'Changed call'))
      await board.verifyStepMark('Dev', /^Today, /)
      // Main checks after each IPC call; give it one more round trip
      await findy.api.state()
      expect(await findy.api.notifications()).toHaveLength(before)
    })
  })

  test('US-5: "Add to calendar" saves an .ics file', async ({ findy }) => {
    const { board, details } = findy.pages
    await findy.api.seed([
      {
        title: 'Dev',
        company: 'Acme',
        url: 'https://acme.com/jobs/1',
        nextStep: { text: 'Interview', date: '2026-12-03', time: '15:00' },
      },
    ])
    await findy.refresh()
    await findy.api.answerFileDialogs(findy.files.path('step.ics'))
    await board.openCard('Dev')
    await details.addStepToCalendar()
    await board.verifyInfo('The calendar file is saved.')
    const ics = findy.files.read('step.ics')
    expect(ics).toContain('DTSTART:20261203T150000\r\nDTEND:20261203T160000')
    expect(ics).toContain('SUMMARY:Interview — Acme')
    expect(ics).toContain('DESCRIPTION:Dev\\nhttps://acme.com/jobs/1')
  })

  test('US-6: search, CSV round trip, MCP', async ({ findy }) => {
    const { board, importDialog } = findy.pages
    await findy.api.seed([
      { title: 'Dev', nextStep: { text: 'Call Olena', date: '2026-12-03', time: '15:00' } },
      { title: 'Other' },
    ])
    await findy.refresh()

    await test.step('US-6.1: search finds the step text', async () => {
      await board.search('olena')
      await board.verifyCards('applied', ['Dev'])
      await board.clearSearchWithEscape()
    })

    await test.step('US-6.2: a CSV round trip keeps the step', async () => {
      await findy.api.answerFileDialogs(findy.files.path('board.csv'))
      await board.exportCsv()
      expect(findy.files.read('board.csv')).toContain('Call Olena,2026-12-03T15:00')
      await findy.api.resetBoard()
      await findy.refresh()
      await board.importCsv()
      await importDialog.confirm('Import 2 applications')
      const steps = (await findy.api.state()).applications.map((app) => app.nextStep)
      expect(steps).toContainEqual({ text: 'Call Olena', date: '2026-12-03', time: '15:00' })
    })

    await test.step('US-6.3: the assistant sets a step; the card shows it in 2 s', async () => {
      await findy.api.setMcpEnabled(true)
      const mcp = await findy.connectMcp()
      const listed = await mcp.call('list_applications', { query: 'Other' })
      const [item] = (listed.data as { applications: { id: string }[] }).applications
      await mcp.call('update_application', {
        id: item!.id,
        nextStep: { text: 'HR call', date: inDays(1), time: '11:00' },
      })
      await expect(async () => board.verifyStepMark('Other', /^Tomorrow, 11:00\sAM$/)).toPass({
        timeout: 2_500,
      })
    })
  })

  for (const theme of ['light', 'dark'] as const) {
    test(
      `marks and the step section have no violations (${theme})`,
      { tag: '@a11y' },
      async ({ findy }) => {
        await findy.api.setTheme(theme)
        await findy.api.seed([
          { title: 'Overdue', nextStep: { text: 'Follow up', date: inDays(-1) } },
          { title: 'Today', nextStep: { text: 'Call', date: today() } },
        ])
        await findy.refresh()
        await findy.pages.board.verifyTheme(theme)
        await findy.pages.a11y.expectNoViolations()
        await findy.pages.board.openCard('Overdue')
        await findy.pages.a11y.expectNoViolations()
      },
    )
  }

  test.describe('in Ukrainian', () => {
    test.use({ systemLocale: 'uk-UA' })

    test('NFR-001: marks in Ukrainian; the board fits 800 × 600', async ({ findy }) => {
      await findy.api.seed([
        { title: 'Dev', nextStep: { text: 'Дзвінок', date: inDays(1), time: '11:00' } },
        { title: 'Old', nextStep: { text: 'Нагадати', date: inDays(-1) } },
      ])
      await findy.refresh()
      await findy.pages.board.verifyStepMark('Dev', /^Завтра, 11:00$/)
      await findy.pages.board.verifyStepMark('Old', /^Прострочено · /)
      await findy.api.setWindowSize(800, 600)
      expect(await findy.api.hasHorizontalScroll()).toBe(false)
    })
  })
})
