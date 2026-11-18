import { join } from 'node:path'
import Database from 'better-sqlite3'
import type { StageId } from '../../src/domain/stages'
import { test, type HistoryApplication } from '../fixtures/app'

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

// Made-up companies only: screenshots go to the README and social posts
const DATA: Record<'en' | 'uk', Demo[]> = {
  en: [
    {
      title: 'Frontend Developer',
      company: 'Example Company 1',
      stage: 'applied',
      days: 1,
      url: 'https://example.com/jobs/1',
    },
    { title: 'React Engineer', company: 'Example Company 2', stage: 'applied', days: 2 },
    {
      title: 'Full-stack Developer',
      company: 'Example Company 3',
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
      company: 'Example Company 4',
      stage: 'test_task',
      days: 6,
      url: 'https://example.com/jobs/3',
      notes: ['Take-home: small kanban app, 3 days.'],
    },
    { title: 'Frontend Lead', company: 'Example Company 5', stage: 'technical_interview', days: 9 },
    {
      title: 'Software Engineer',
      company: 'Example Company 6',
      stage: 'c_level_interview',
      days: 12,
      notes: ['Talk with the CTO about the team and roadmap.'],
    },
    {
      title: 'UI Engineer',
      company: 'Example Company 7',
      stage: 'offered',
      days: 15,
      url: 'https://example.com/jobs/4',
    },
    { title: 'JavaScript Developer', company: 'Example Company 8', stage: 'rejected', days: 20 },
  ],
  uk: [
    {
      title: 'Frontend-розробник',
      company: 'Компанія-приклад 1',
      stage: 'applied',
      days: 1,
      url: 'https://example.com/jobs/1',
    },
    { title: 'React-інженер', company: 'Компанія-приклад 2', stage: 'applied', days: 2 },
    {
      title: 'Full-stack розробник',
      company: 'Компанія-приклад 3',
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
      company: 'Компанія-приклад 4',
      stage: 'test_task',
      days: 6,
      url: 'https://example.com/jobs/3',
      notes: ['Тестове: маленький канбан-застосунок, 3 дні.'],
    },
    {
      title: 'Frontend Lead',
      company: 'Компанія-приклад 5',
      stage: 'technical_interview',
      days: 9,
    },
    {
      title: 'Software Engineer',
      company: 'Компанія-приклад 6',
      stage: 'c_level_interview',
      days: 12,
      notes: ['Розмова з CTO про команду й плани.'],
    },
    {
      title: 'UI-інженер',
      company: 'Компанія-приклад 7',
      stage: 'offered',
      days: 15,
      url: 'https://example.com/jobs/4',
    },
    { title: 'JavaScript-розробник', company: 'Компанія-приклад 8', stage: 'rejected', days: 20 },
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

// Spec 005: three months of made-up history, so the charts have a shape. Fixed seed,
// so the screenshots change only when the app changes.
function demoHistory(): HistoryApplication[] {
  let seed = 7
  const random = () => (seed = (seed * 1_103_515_245 + 12_345) % 2 ** 31) / 2 ** 31
  return Array.from({ length: 70 }, (_, i) => {
    // More applications in the recent weeks
    const created = Math.floor(84 * random() ** 1.5)
    const reach = random()
    const path: StageId[] = []
    if (reach > 0.45) path.push('hr_interview')
    if (reach > 0.62 && random() > 0.4) path.push('test_task')
    if (reach > 0.72) path.push('technical_interview')
    if (reach > 0.88) path.push('c_level_interview')
    if (reach > 0.95) path.push('offered')
    if (path.at(-1) !== 'offered' && random() > 0.55) path.push('rejected')
    let day = created
    const moves = path.map((stage): [StageId, number] => {
      day = Math.max(0, day - 1 - Math.floor(random() * 6))
      return [stage, day]
    })
    return { title: `Example role ${i + 1}`, createdDaysAgo: created, moves }
  })
}

test.describe('analytics', () => {
  test.use({ history: { applications: demoHistory() } })

  for (const lang of ['en', 'uk'] as const) {
    test(`README analytics screenshot (${lang})`, async ({ findy, page }) => {
      // An emulated viewport at Retina density, like the other screenshots: the screen
      // limits the height of a real window
      const cdp = await page.context().newCDPSession(page)
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: 1440,
        height: 1060,
        deviceScaleFactor: 2,
        mobile: false,
      })
      await findy.api.setTheme('light')
      await findy.api.setLanguage(lang)
      await findy.api.setAnalyticsView({ period: '90d', grouping: 'week' })
      await findy.refresh()
      await page.getByRole('tab', { name: lang === 'en' ? 'Analytics' : 'Аналітика' }).click()
      await page
        .getByTestId('app')
        .getByRole('tabpanel')
        .getByRole('heading', { level: 2 })
        .waitFor()
      await page.screenshot({ path: join(OUT, `analytics-${lang}.png`) })
    })
  }
})
