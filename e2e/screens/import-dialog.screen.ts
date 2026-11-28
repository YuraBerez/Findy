import { expect, type Locator, type Page } from '@playwright/test'
import { BaseComponent } from 'playwright-e2e-kit'

/** Spec 008 FR-020: the import summary. */
export class ImportDialogScreen extends BaseComponent {
  private readonly dialog: Locator
  private readonly errors: Locator

  constructor(page: Page) {
    super(page)
    this.dialog = page.getByTestId('import-dialog')
    this.errors = this.dialog.getByTestId('import-errors').getByRole('listitem')
  }

  private button(name: string | RegExp): Locator {
    return this.dialog.getByRole('button', { name })
  }

  async confirm(label: string): Promise<void> {
    await this.button(label).click()
    await expect(this.dialog).toBeHidden()
  }

  async cancel(): Promise<void> {
    await this.button(/^(Cancel|Скасувати)$/).click()
    await expect(this.dialog).toBeHidden()
  }

  async close(): Promise<void> {
    await this.button(/^(Close|Закрити|Zamknij)$/)
      .last()
      .click()
    await expect(this.dialog).toBeHidden()
  }

  /** US-3.1: focus starts on Cancel; Tab goes to the confirm button, Enter imports */
  async confirmWithKeyboard(label: string): Promise<void> {
    const cancel = this.button(/^(Cancel|Скасувати)$/)
    await expect(cancel).toBeFocused()
    await cancel.press('Tab')
    await expect(this.button(label)).toBeFocused()
    await this.button(label).press('Enter')
    await expect(this.dialog).toBeHidden()
  }

  async verifyShown(fileName: string, lines: string[]): Promise<void> {
    await expect(this.dialog).toBeVisible()
    await expect(this.dialog).toContainText(fileName)
    for (const line of lines) await expect(this.dialog).toContainText(line)
  }

  async verifyErrors(lines: string[]): Promise<void> {
    await expect(this.errors).toHaveText(lines)
  }

  /** FR-020: with nothing to add, only "Close" */
  async verifyOnlyClose(): Promise<void> {
    await expect(this.button(/^(Import|Імпортувати)/)).toHaveCount(0)
    await expect(this.button(/^(Close|Закрити|Zamknij)$/).last()).toBeVisible()
  }
}
