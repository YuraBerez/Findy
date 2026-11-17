import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { launchApp, newUserDataDir } from './helpers'

test('US-6.1: data persists across restarts', async () => {
  const dir = newUserDataDir()
  let { app, page } = await launchApp(dir)
  await page.evaluate(async () => {
    const state = await window.findy.createApplication({
      title: 'Frontend Developer',
      company: 'Acme',
      url: 'https://acme.com/jobs/1',
    })
    const id = state.applications[0]!.id
    await window.findy.moveApplication(id, { stage: 'hr_interview', index: 0 })
    await window.findy.addNote(id, 'Call with the recruiter')
  })
  await app.close()

  ;({ app, page } = await launchApp(dir))
  const state = await page.evaluate(() => window.findy.getState())
  expect(state.applications).toHaveLength(1)
  expect(state.applications[0]).toMatchObject({
    title: 'Frontend Developer',
    company: 'Acme',
    stage: 'hr_interview',
    notes: [{ text: 'Call with the recruiter' }],
  })
  expect(state.applications[0]!.stageHistory.map((c) => c.stage)).toEqual([
    'applied',
    'hr_interview',
  ])
  await app.close()
})

test('US-6.3: a corrupt database is kept, copied, and explained', async () => {
  const dir = newUserDataDir()
  const file = join(dir, 'findy.db')
  writeFileSync(file, 'definitely not sqlite')

  const { app, page } = await launchApp(dir)

  const banner = page.getByTestId('storage-error')
  await expect(banner).toBeVisible()
  await expect(banner).toContainText('Your data could not be opened')
  await expect(banner).toContainText(file)
  expect(readFileSync(file, 'utf8')).toBe('definitely not sqlite')
  expect(readdirSync(dir).some((name) => name.startsWith('findy.corrupt-'))).toBe(true)

  const error = await page.evaluate(() =>
    window.findy.createApplication({ title: 'a', company: 'b' }).then(
      () => 'saved',
      (e: Error) => e.message,
    ),
  )
  expect(error).toMatch(/^STORAGE: Storage is not available/)
  await app.close()
})
