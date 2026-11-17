import { expect, test, type Page } from '@playwright/test'
import { launchApp } from './helpers'

const dialog = (page: Page) => page.getByRole('dialog', { name: 'New application' })
const column = (page: Page, stage: string) => page.getByTestId(`column-${stage}`)

async function openDialog(page: Page) {
  await page.getByRole('banner').getByRole('button', { name: 'Add application' }).click()
  await expect(dialog(page)).toBeVisible()
}

test('empty board shows a call to action (spec 001, edge cases)', async () => {
  const { app, page } = await launchApp()
  const empty = page.getByTestId('empty-board')
  await expect(empty).toContainText('No applications yet')
  await empty.getByRole('button', { name: 'Add application' }).click()
  await expect(dialog(page)).toBeVisible()
  await app.close()
})

test('US-1.1: a new application appears on top of Applied', async () => {
  const { app, page } = await launchApp()
  await page.evaluate(() => window.findy.createApplication({ title: 'Older', company: 'Globex' }))
  await page.reload()

  await openDialog(page)
  await dialog(page).getByLabel('Job title').fill('Frontend Developer')
  await dialog(page).getByLabel('Company').fill('Acme')
  await dialog(page)
    .getByLabel(/Vacancy link/)
    .fill('https://acme.com/jobs/1')
  await dialog(page).getByRole('button', { name: 'Add' }).click()

  await expect(dialog(page)).toBeHidden()
  const cards = column(page, 'applied').getByTestId('card')
  await expect(cards).toHaveCount(2)
  await expect(cards.first()).toContainText('Frontend Developer')
  await expect(cards.first()).toContainText('Acme')
  await expect(cards.first()).toContainText('0 notes')
  await expect(column(page, 'applied')).toContainText('2')
  await expect(page.getByTestId('empty-board')).toBeHidden()
  await app.close()
})

test('US-1.2: empty required fields block submit and show errors', async () => {
  const { app, page } = await launchApp()
  await openDialog(page)
  await dialog(page).getByRole('button', { name: 'Add' }).click()

  const title = dialog(page).getByLabel('Job title')
  await expect(title).toHaveAttribute('aria-invalid', 'true')
  await expect(title).toBeFocused()
  await expect(dialog(page).getByLabel('Company')).toHaveAttribute('aria-invalid', 'true')
  await expect(dialog(page).getByText('Fill in this field.')).toHaveCount(2)
  await expect(page.getByTestId('card')).toHaveCount(0)

  // Typing clears the error of that field
  await title.fill('Dev')
  await expect(title).not.toHaveAttribute('aria-invalid')
  await app.close()
})

test('US-1.3: an invalid URL shows a validation error', async () => {
  const { app, page } = await launchApp()
  await openDialog(page)
  await dialog(page).getByLabel('Job title').fill('Dev')
  await dialog(page).getByLabel('Company').fill('Acme')
  await dialog(page)
    .getByLabel(/Vacancy link/)
    .fill('acme jobs')
  await dialog(page).getByRole('button', { name: 'Add' }).click()

  await expect(
    dialog(page).getByText('Enter a link that starts with http:// or https://.'),
  ).toBeVisible()
  await expect(page.getByTestId('card')).toHaveCount(0)
  await app.close()
})

test('US-1.4 and 1.5: URL is optional and the stage can be chosen', async () => {
  const { app, page } = await launchApp()
  await openDialog(page)
  await dialog(page).getByLabel('Job title').fill('QA Engineer')
  await dialog(page).getByLabel('Company').fill('Initech')
  await dialog(page).getByLabel('Stage').selectOption({ label: 'Test task' })
  await dialog(page).getByRole('button', { name: 'Add' }).click()

  await expect(column(page, 'test_task').getByTestId('card')).toContainText('QA Engineer')
  await expect(column(page, 'applied').getByTestId('card')).toHaveCount(0)
  const [saved] = (await page.evaluate(() => window.findy.getState())).applications
  expect(saved).toMatchObject({ url: null, stage: 'test_task' })
  await app.close()
})

test('Esc and Cancel close the dialog without saving', async () => {
  const { app, page } = await launchApp()
  await openDialog(page)
  await dialog(page).getByLabel('Job title').fill('Draft')
  await page.keyboard.press('Escape')
  await expect(dialog(page)).toBeHidden()

  await openDialog(page)
  await expect(dialog(page).getByLabel('Job title')).toHaveValue('')
  await dialog(page).getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog(page)).toBeHidden()
  await expect(page.getByTestId('card')).toHaveCount(0)
  await app.close()
})

test('board shows all seven stages in order (FR-001, FR-002)', async () => {
  const { app, page } = await launchApp()
  await expect(
    page.getByRole('list', { name: 'Job applications board' }).getByRole('heading'),
  ).toHaveText([
    'Applied',
    'HR interview',
    'Test task',
    'Technical interview',
    'C-level interview',
    'Offer',
    'Rejected',
  ])
  await app.close()
})
