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

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** The "New application" dialog (US-1). */
export class ApplicationDialogScreen extends BaseComponent {
  private readonly dialog: Locator
  private readonly fields: Record<Field, Locator>
  private readonly stageSelect: Locator
  private readonly submitButton: Locator
  private readonly cancelButton: Locator
  private readonly fillFromLinkButton: Locator

  constructor(page: Page) {
    super(page)
    this.dialog = page.getByRole('dialog', { name: /^(New application|Нова заявка)$/ })
    this.fields = {
      title: this.dialog.getByLabel(/^(Job title|Назва посади)$/),
      company: this.dialog.getByLabel(/^(Company|Компанія)$/),
      url: this.dialog.getByLabel(/^(Vacancy link|Посилання на вакансію)/),
    }
    this.stageSelect = this.dialog.getByLabel('Stage')
    this.submitButton = this.dialog.getByRole('button', { name: 'Add' })
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' })
    this.fillFromLinkButton = this.dialog.getByRole('button', {
      name: /^(Fill from link|Заповнити з посилання)$/,
    })
  }

  // ── Spec 009: fill from a vacancy link ──────────────────────────────────

  /** Pastes the clipboard over the link field with the keyboard; it holds `text` (FR-001) */
  async pasteLink(text: string): Promise<void> {
    await this.fields.url.press('ControlOrMeta+a')
    await this.fields.url.press('ControlOrMeta+v')
    await expect(this.fields.url).toHaveValue(text)
  }

  async fillFromLink(): Promise<void> {
    await this.fillFromLinkButton.click()
  }

  /** US-3.1: Tab from the link field reaches the button; Enter uses it */
  async fillFromLinkWithKeyboard(): Promise<void> {
    await this.fields.url.press('Tab')
    await expect(this.fillFromLinkButton).toBeFocused()
    await this.fillFromLinkButton.press('Enter')
  }

  async verifyFillFromLinkEnabled(enabled: boolean): Promise<void> {
    if (enabled) await expect(this.fillFromLinkButton).toBeEnabled()
    else await expect(this.fillFromLinkButton).toBeDisabled()
  }

  /** FR-005, FR-006: the status under the link field ('' for none); it describes the field */
  async verifyLinkStatus(text: string): Promise<void> {
    const status = this.dialog.getByRole('status')
    await expect(status).toHaveText(text)
    if (text) await expect(this.fields.url).toHaveAccessibleDescription(new RegExp(escape(text)))
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

  async closeWithCross(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Close' }).click()
  }

  /** A click on the dimmed backdrop above the dialog */
  async closeByClickingOutside(): Promise<void> {
    await this.dialog.click({ position: { x: 20, y: -20 } })
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

  async verifyStageOptions(names: string[], selected: string): Promise<void> {
    await expect(this.stageSelect.getByRole('option')).toHaveText(names)
    await expect(this.stageSelect.getByRole('option', { selected: true })).toHaveText(selected)
  }

  async verifyValue(field: Field, value: string): Promise<void> {
    await expect(this.fields[field]).toHaveValue(value)
  }

  async verifyEmpty(): Promise<void> {
    for (const field of Object.values(this.fields)) await expect(field).toHaveValue('')
  }

  async verifyInvalid(field: Field, message: string): Promise<void> {
    await expect(this.fields[field]).toHaveAttribute('aria-invalid', 'true')
    await expect(this.fields[field]).toHaveAccessibleDescription(new RegExp(escape(message)))
  }

  async verifyValid(field: Field): Promise<void> {
    await expect(this.fields[field]).not.toHaveAttribute('aria-invalid')
  }

  async verifyFocused(field: Field): Promise<void> {
    await expect(this.fields[field]).toBeFocused()
  }
}
