import { expect, type Locator, type Page } from '@playwright/test'
import { BaseComponent } from 'playwright-e2e-kit'

export interface ApplicationForm {
  title?: string
  company?: string
  url?: string
  /** Visible stage name, e.g. "Test task" */
  stage?: string
}

type Field = 'title' | 'company' | 'url'

/** The "New application" dialog (US-1). */
export class ApplicationDialogScreen extends BaseComponent {
  private readonly dialog: Locator
  private readonly fields: Record<Field, Locator>
  private readonly stageSelect: Locator
  private readonly submitButton: Locator
  private readonly cancelButton: Locator

  constructor(page: Page) {
    super(page)
    this.dialog = page.getByRole('dialog', { name: 'New application' })
    this.fields = {
      title: this.dialog.getByLabel('Job title'),
      company: this.dialog.getByLabel('Company'),
      url: this.dialog.getByLabel(/^Vacancy link/),
    }
    this.stageSelect = this.dialog.getByLabel('Stage')
    this.submitButton = this.dialog.getByRole('button', { name: 'Add' })
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' })
  }

  async fill(form: ApplicationForm): Promise<void> {
    if (form.title !== undefined) await this.fields.title.fill(form.title)
    if (form.company !== undefined) await this.fields.company.fill(form.company)
    if (form.url !== undefined) await this.fields.url.fill(form.url)
    if (form.stage !== undefined) await this.stageSelect.selectOption({ label: form.stage })
  }

  async submit(): Promise<void> {
    await this.submitButton.click()
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click()
  }

  async dismissWithEscape(): Promise<void> {
    await this.fields.title.press('Escape')
  }

  async verifyOpen(): Promise<void> {
    await expect(this.dialog).toBeVisible()
  }

  async verifyClosed(): Promise<void> {
    await expect(this.dialog).toBeHidden()
  }

  async verifyEmpty(): Promise<void> {
    for (const field of Object.values(this.fields)) await expect(field).toHaveValue('')
  }

  async verifyInvalid(field: Field, message: string): Promise<void> {
    await expect(this.fields[field]).toHaveAttribute('aria-invalid', 'true')
    await expect(this.fields[field]).toHaveAccessibleDescription(
      new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    )
  }

  async verifyValid(field: Field): Promise<void> {
    await expect(this.fields[field]).not.toHaveAttribute('aria-invalid')
  }

  async verifyFocused(field: Field): Promise<void> {
    await expect(this.fields[field]).toBeFocused()
  }
}
