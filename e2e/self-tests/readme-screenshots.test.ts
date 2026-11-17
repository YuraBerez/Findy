import { join } from 'node:path'
import Database from 'better-sqlite3'
import { test } from '../fixtures/app'

// Regenerates docs/screenshots/*.png for the READMEs: `npm run screenshots`.
// Skipped in normal test runs.
test.skip(!process.env.UPDATE_SCREENSHOTS, 'run with `npm run screenshots`')

const OUT = join(process.cwd(), 'docs', 'screenshots')
const DAY = 86_400_000

type Demo = {
  title: string
  company: string
  stage: string
  days: number
  url?: string
  notes?: string[]
}

const DATA: Record<'en' | 'uk', Demo[]> = {
  en: [
    {
      title: 'Frontend Developer',
      company: 'Brightwave',
      stage: 'applied',
      days: 1,
      url: 'https://example.com/jobs/1',
    },
    { title: 'React Engineer', company: 'Pixelforge', stage: 'applied', days: 2 },
    {
      title: 'Full-stack Developer',
      company: 'Nordlight',
      stage: 'hr_interview',
      days: 4,
      url: 'https://example.com/jobs/2',
      notes: [
        'Call with Olena (recruiter). Salary range discussed: 4–5k.',
        'Next step: test task, deadline Friday.',
      ],
    },
    {
      title: 'Senior TypeScript Developer',
      company: 'Datacraft',
      stage: 'test_task',
      days: 6,
      url: 'https://example.com/jobs/3',
      notes: ['Take-home: small kanban app, 3 days.'],
    },
    { title: 'Frontend Lead', company: 'Bluepeak', stage: 'technical_interview', days: 9 },
    {
      title: 'Software Engineer',
      company: 'Cloudnest',
      stage: 'c_level_interview',
      days: 12,
      notes: ['Talk with the CTO about the team and roadmap.'],
    },
    {
      title: 'UI Engineer',
      company: 'Greenfield',
      stage: 'offered',
      days: 15,
      url: 'https://example.com/jobs/4',
    },
    { title: 'JavaScript Developer', company: 'Quanta Labs', stage: 'rejected', days: 20 },
  ],
  uk: [
    {
      title: 'Frontend-розробник',
      company: 'Brightwave',
      stage: 'applied',
      days: 1,
      url: 'https://example.com/jobs/1',
    },
    { title: 'React-інженер', company: 'Pixelforge', stage: 'applied', days: 2 },
    {
      title: 'Full-stack розробник',
      company: 'Nordlight',
      stage: 'hr_interview',
      days: 4,
      url: 'https://example.com/jobs/2',
      notes: [
        'Дзвінок з Оленою (рекрутерка). Обговорили зарплату: 4–5k.',
        'Наступний крок: тестове завдання до пʼятниці.',
      ],
    },
    {
      title: 'Senior TypeScript-розробник',
      company: 'Datacraft',
      stage: 'test_task',
      days: 6,
      url: 'https://example.com/jobs/3',
      notes: ['Тестове: маленький канбан-застосунок, 3 дні.'],
    },
    { title: 'Frontend Lead', company: 'Bluepeak', stage: 'technical_interview', days: 9 },
    {
      title: 'Software Engineer',
      company: 'Cloudnest',
      stage: 'c_level_interview',
      days: 12,
      notes: ['Розмова з CTO про команду й плани.'],
    },
    {
      title: 'UI-інженер',
      company: 'Greenfield',
      stage: 'offered',
      days: 15,
      url: 'https://example.com/jobs/4',
    },
    { title: 'JavaScript-розробник', company: 'Quanta Labs', stage: 'rejected', days: 20 },
  ],
}

for (const lang of ['en', 'uk'] as const) {
  test(`README screenshots (${lang})`, async ({ findy, page, electronApp, userDataDir }) => {
    await electronApp.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0]!.setSize(1440, 860),
    )
    await findy.api.setTheme('light')
    await findy.api.setLanguage(lang)
    await findy.api.seed(
      DATA[lang].map(({ title, company, stage, url }) => ({
        title,
        company,
        stage: stage as never,
        url: url ?? null,
      })),
    )
    for (const item of DATA[lang])
      for (const note of item.notes ?? []) await findy.api.addNote(item.title, note)

    // Back-date the history, so cards show "4 days ago" and not "this minute"
    const db = new Database(join(userDataDir, 'findy.db'))
    for (const item of DATA[lang]) {
      const { id } = db.prepare('SELECT id FROM applications WHERE title = ?').get(item.title) as {
        id: string
      }
      const entered = new Date(Date.now() - item.days * DAY).toISOString()
      const created = new Date(Date.now() - (item.days + 2) * DAY).toISOString()
      db.prepare('UPDATE applications SET created_at = ?, updated_at = ? WHERE id = ?').run(
        created,
        entered,
        id,
      )
      db.prepare('UPDATE stage_changes SET at = ? WHERE application_id = ?').run(entered, id)
      db.prepare('UPDATE notes SET created_at = ? WHERE application_id = ?').run(entered, id)
    }
    db.close()
    await findy.refresh()

    await page.screenshot({ path: join(OUT, `board-${lang}.png`) })
    await page.getByRole('button', { name: new RegExp(`^${DATA[lang][2]!.title}`) }).click()
    await page.getByTestId('details').waitFor()
    await page.screenshot({ path: join(OUT, `details-${lang}.png`) })
  })
}
