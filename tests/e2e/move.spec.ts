import { expect, test, type Locator, type Page } from '@playwright/test'
import { launchApp } from './helpers'

const column = (page: Page, stage: string) => page.getByTestId(`column-${stage}`)
const titles = (page: Page, stage: string) =>
  column(page, stage).getByTestId('card').locator('h3').allTextContents()

async function seed(page: Page, items: { title: string; stage?: string }[]) {
  await page.evaluate(async (list) => {
    // Created in reverse so the first item ends on top (FR-023)
    for (const item of [...list].reverse()) {
      await window.findy.createApplication({
        title: item.title,
        company: 'Acme',
        stage: (item.stage ?? 'applied') as never,
      })
    }
  }, items)
  await page.reload()
  await page.getByTestId('app').waitFor()
}

/** dnd-kit listens to pointer events, so drag in small steps like a real mouse. */
async function drag(page: Page, source: Locator, target: Locator, offsetY = 0.5) {
  const from = (await source.boundingBox())!
  const to = (await target.boundingBox())!
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
  await page.mouse.down()
  await page.mouse.move(from.x + from.width / 2 + 10, from.y + from.height / 2, { steps: 5 })
  await page.mouse.move(to.x + to.width / 2, to.y + to.height * offsetY, { steps: 15 })
  await page.mouse.move(to.x + to.width / 2, to.y + to.height * offsetY + 2, { steps: 3 })
  await page.mouse.up()
}

test('US-2.1 and 2.4: drag a card to another stage; history records the move', async () => {
  const { app, page } = await launchApp()
  await seed(page, [{ title: 'Frontend Developer' }])

  const card = column(page, 'applied').getByTestId('card').first()
  await drag(page, card, column(page, 'hr_interview'), 0.3)

  await expect.poll(() => titles(page, 'hr_interview')).toEqual(['Frontend Developer'])
  expect(await titles(page, 'applied')).toEqual([])
  const [saved] = (await page.evaluate(() => window.findy.getState())).applications
  expect(saved!.stage).toBe('hr_interview')
  expect(saved!.stageHistory.map((change) => change.stage)).toEqual(['applied', 'hr_interview'])
  await app.close()
})

test('FR-020: cards move backwards too, by drag, menu and keyboard', async () => {
  const { app, page } = await launchApp()
  await seed(page, [
    { title: 'Test card', stage: 'test_task' },
    { title: 'Rejected card', stage: 'rejected' },
  ])

  // Drag from Test task back to Applied (both on screen at 1280 px)
  const source = column(page, 'test_task').getByTestId('card').first()
  await drag(page, source, column(page, 'applied'), 0.3)
  await expect.poll(() => titles(page, 'applied')).toEqual(['Test card'])
  expect(await titles(page, 'test_task')).toEqual([])

  // Menu: from Rejected back to HR interview
  await page.getByRole('button', { name: 'Actions for Rejected card' }).click()
  await page.getByRole('menuitem', { name: 'HR interview' }).click()
  await expect.poll(() => titles(page, 'hr_interview')).toEqual(['Rejected card'])

  // Keyboard: one column back
  await column(page, 'hr_interview').getByTestId('card').first().focus()
  await page.keyboard.press('Space')
  await page.keyboard.press('ArrowLeft')
  await page.waitForTimeout(300)
  await page.keyboard.press('Space')
  await expect.poll(() => titles(page, 'applied')).toContain('Rejected card')
  expect(await titles(page, 'hr_interview')).toEqual([])
  await app.close()
})

test('US-2.2: the Move to… menu moves a card to Rejected', async () => {
  const { app, page } = await launchApp()
  await seed(page, [{ title: 'Backend Engineer' }])

  await page.getByRole('button', { name: 'Actions for Backend Engineer' }).click()
  const menu = page.getByRole('menu', { name: 'Move to' })
  await expect(menu.getByRole('menuitem')).toHaveCount(6) // all stages except the current one
  await menu.getByRole('menuitem', { name: 'Rejected' }).click()

  await expect.poll(() => titles(page, 'rejected')).toEqual(['Backend Engineer'])
  await expect(menu).toBeHidden()
  await app.close()
})

test('US-2.2 (keyboard): open the menu and pick a stage without a mouse', async () => {
  const { app, page } = await launchApp()
  await seed(page, [{ title: 'QA Engineer' }])

  const trigger = page.getByRole('button', { name: 'Actions for QA Engineer' })
  await trigger.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('menuitem', { name: 'HR interview' })).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('menuitem', { name: 'Test task' })).toBeFocused()
  await page.keyboard.press('Enter')

  await expect.poll(() => titles(page, 'test_task')).toEqual(['QA Engineer'])
  // Focus follows the card into its new column
  await expect(column(page, 'test_task').getByTestId('card').first()).toBeFocused()

  // Escape closes the menu and returns focus
  await trigger.click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menu')).toBeHidden()
  await expect(trigger).toBeFocused()
  await app.close()
})

test('US-2.3: reordering within a column persists after restart', async () => {
  const { app, page, userDataDir } = await launchApp()
  await seed(page, [{ title: 'A' }, { title: 'B' }, { title: 'C' }])
  expect(await titles(page, 'applied')).toEqual(['A', 'B', 'C'])

  const cards = column(page, 'applied').getByTestId('card')
  await drag(page, cards.nth(2), cards.nth(0), 0.2)
  await expect.poll(() => titles(page, 'applied')).toEqual(['C', 'A', 'B'])
  await app.close()

  const again = await launchApp(userDataDir)
  expect(await titles(again.page, 'applied')).toEqual(['C', 'A', 'B'])
  const state = await again.page.evaluate(() => window.findy.getState())
  expect(state.applications.find((a) => a.title === 'C')!.stageHistory).toHaveLength(1)
  await again.app.close()
})

test('FR-021: drag with the keyboard (Space, arrows, Space)', async () => {
  const { app, page } = await launchApp()
  await seed(page, [{ title: 'Designer' }])

  await column(page, 'applied').getByTestId('card').first().focus()
  await page.keyboard.press('Space')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(300) // let the drop animation settle
  await page.keyboard.press('Space')

  await expect.poll(() => titles(page, 'test_task')).toEqual(['Designer'])
  await expect(column(page, 'test_task').getByTestId('card').first()).toBeFocused()
  await app.close()
})
