import { expect, type Locator, type Page } from '@playwright/test'
import { BaseComponent } from 'playwright-e2e-kit'

/** Spec 010 FR-008: the dialog for N, the days after which an application is stale. */
export class StaleDialogScreen extends BaseComponent {
  private readonly dialog: Locator
  private readonly days: Locator

  constructor(page: Page) {
    super(page)
    this.dialog = page.getByRole('dialog', { name: /^(Stale applications|Заявки без руху)$/ })
    this.days = this.dialog.getByLabel(/^(Days in a stage without movement|Днів на етапі без руху)/)
  }

  async verifyOpen(days: string): Promise<void> {
    await expect(this.dialog).toBeVisible()
    await expect(this.days).toHaveValue(days)
  }

  async setDays(value: string): Promise<void> {
    await this.days.fill(value)
  }

  async save(): Promise<void> {
    await this.dialog.getByRole('button', { name: /^(Save|Зберегти)$/ }).click()
  }

  /** US-4.1: type and save with Enter */
  async saveWithKeyboard(value: string): Promise<void> {
    await this.days.fill(value)
    await this.days.press('Enter')
  }

  async cancel(): Promise<void> {
    await this.dialog.getByRole('button', { name: /^(Cancel|Скасувати)$/ }).click()
  }

  async verifyClosed(): Promise<void> {
    await expect(this.dialog).toBeHidden()
  }

  async verifyError(message: string): Promise<void> {
    await expect(this.days).toHaveAttribute('aria-invalid', 'true')
    await expect(this.days).toHaveAccessibleDescription(new RegExp(message))
  }
}
