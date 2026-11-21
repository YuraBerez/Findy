import { expect, type Locator, type Page } from '@playwright/test'
import { BaseComponent } from 'playwright-e2e-kit'
import type { ApplicationForm } from './application-dialog.screen'

/** Spec 014: the extra fields as a user types or picks them; labels of the options */
export interface ExtraFieldsForm {
  salaryFrom?: string
  salaryTo?: string
  currency?: string
  period?: string
  workFormat?: string
  location?: string
  source?: string
  contactName?: string
  contactDetails?: string
}

const TEXT_INPUTS = {
  salaryFrom: 'Salary from',
  salaryTo: 'Salary to',
  location: 'Location',
  contactName: 'Contact name',
  contactDetails: 'Contact details',
} as const

const SELECTS = {
  currency: 'Currency',
  period: 'Period',
  workFormat: 'Work format',
  source: 'Source',
} as const

/** The details side panel of one application (US-4) with its notes (US-3). */
export class ApplicationDetailsScreen extends BaseComponent {
  private readonly panel: Locator
  private readonly heading: Locator
  private readonly saveButton: Locator
  private readonly savedStatus: Locator
  private readonly openVacancyButton: Locator
  private readonly deleteButton: Locator
  private readonly closeButton: Locator
  private readonly history: Locator
  private readonly newNote: Locator
  private readonly addNoteButton: Locator
  private readonly notes: Locator
  private readonly confirm: Locator
  private readonly colors: Locator

  constructor(page: Page) {
    super(page)
    this.panel = page.getByTestId('details')
    this.heading = this.panel.getByRole('heading', { level: 2 })
    this.saveButton = this.panel.getByRole('button', { name: 'Save changes' })
    this.savedStatus = this.panel.getByRole('status')
    this.openVacancyButton = this.panel.getByRole('button', { name: 'Open vacancy' })
    this.deleteButton = this.panel.getByRole('button', { name: 'Delete application' })
    this.closeButton = this.panel.getByRole('button', { name: 'Close' })
    this.history = this.panel.getByRole('region', { name: 'Stage history' }).getByRole('listitem')
    this.newNote = this.panel.getByLabel('New note')
    this.addNoteButton = this.panel.getByRole('button', { name: 'Add note' })
    this.notes = this.panel.getByTestId('note')
    this.confirm = page.getByRole('alertdialog')
    this.colors = this.panel.getByRole('radiogroup', { name: 'Colour' })
  }

  private note(text: string): Locator {
    return this.notes.filter({ hasText: text })
  }

  // ── Application ────────────────────────────────────────────────────────

  async edit(form: ApplicationForm): Promise<void> {
    if (form.title !== undefined) await this.panel.getByLabel('Job title').fill(form.title)
    if (form.company !== undefined) await this.panel.getByLabel('Company').fill(form.company)
    if (form.url !== undefined) await this.panel.getByLabel(/^Vacancy link/).fill(form.url)
    if (form.stage !== undefined)
      await this.panel.getByLabel('Stage', { exact: true }).selectOption({ label: form.stage })
    await this.saveButton.click()
  }

  /** Spec 014: fills the given fields, then saves */
  async editFields(form: ExtraFieldsForm): Promise<void> {
    for (const [field, label] of Object.entries(TEXT_INPUTS)) {
      const value = form[field as keyof typeof TEXT_INPUTS]
      if (value !== undefined) await this.panel.getByLabel(label).fill(value)
    }
    for (const [field, label] of Object.entries(SELECTS)) {
      const value = form[field as keyof typeof SELECTS]
      if (value !== undefined)
        await this.panel.getByLabel(label, { exact: true }).selectOption({ label: value })
    }
    await this.saveButton.click()
  }

  /** Spec 014 US-4.2 */
  async openContactLink(): Promise<void> {
    await this.panel.getByRole('button', { name: 'Open the contact link' }).click()
  }

  /** Spec 007 US-2: saved at once, no "Save changes" */
  async chooseColor(name: string): Promise<void> {
    await this.colors.getByRole('radio', { name }).click()
  }

  async openVacancy(): Promise<void> {
    await this.openVacancyButton.click()
  }

  async delete(answer: 'confirm' | 'cancel'): Promise<void> {
    await this.deleteButton.click()
    await this.confirm
      .getByRole('button', { name: answer === 'confirm' ? 'Delete application' : 'Cancel' })
      .click()
  }

  async close(): Promise<void> {
    await this.closeButton.click()
  }

  /** A click on the dimmed board left of the panel */
  async closeByClickingOutside(): Promise<void> {
    await this.panel.click({ position: { x: -100, y: 200 } })
  }

  async closeWithEscape(): Promise<void> {
    await this.heading.press('Escape')
  }

  /** A key combination inside the open panel, e.g. an app shortcut (spec 005 FR-002) */
  async pressShortcut(keys: string): Promise<void> {
    await this.heading.press(keys)
  }

  // ── Notes ──────────────────────────────────────────────────────────────

  async addNote(text: string): Promise<void> {
    await this.newNote.fill(text)
    await this.addNoteButton.click()
  }

  async editNote(text: string, next: string): Promise<void> {
    await this.note(text).getByRole('button', { name: 'Edit' }).click()
    await this.panel.getByLabel('Note text').fill(next)
    await this.panel.getByRole('button', { name: 'Save', exact: true }).click()
  }

  async deleteNote(text: string, answer: 'confirm' | 'cancel'): Promise<void> {
    await this.note(text).getByRole('button', { name: 'Delete' }).click()
    await this.confirm
      .getByRole('button', { name: answer === 'confirm' ? 'Delete' : 'Cancel' })
      .click()
  }

  // ── Checks ─────────────────────────────────────────────────────────────

  async verifyOpen(title: string): Promise<void> {
    await expect(this.panel).toBeVisible()
    await expect(this.heading).toHaveText(title)
  }

  async verifyClosed(): Promise<void> {
    await expect(this.panel).toBeHidden()
  }

  async verifyShows(texts: string[]): Promise<void> {
    for (const text of texts) await expect(this.panel).toContainText(text)
  }

  async verifyFields(
    form: Required<Omit<ApplicationForm, 'stage'>> & { stage: string },
  ): Promise<void> {
    await expect(this.panel.getByLabel('Job title')).toHaveValue(form.title)
    await expect(this.panel.getByLabel('Company')).toHaveValue(form.company)
    await expect(this.panel.getByLabel(/^Vacancy link/)).toHaveValue(form.url)
    await expect(
      this.panel.getByLabel('Stage', { exact: true }).getByRole('option', { selected: true }),
    ).toHaveText(form.stage)
  }

  /** Spec 014: the values of the given extra fields */
  async verifyExtraFields(form: ExtraFieldsForm): Promise<void> {
    for (const [field, label] of Object.entries(TEXT_INPUTS)) {
      const value = form[field as keyof typeof TEXT_INPUTS]
      if (value !== undefined) await expect(this.panel.getByLabel(label)).toHaveValue(value)
    }
    for (const [field, label] of Object.entries(SELECTS)) {
      const value = form[field as keyof typeof SELECTS]
      if (value !== undefined)
        await expect(
          this.panel.getByLabel(label, { exact: true }).getByRole('option', { selected: true }),
        ).toHaveText(value)
    }
  }

  /** Spec 014 FR-013: the error next to a text field, and the field has the focus */
  async verifyFieldError(field: keyof typeof TEXT_INPUTS, message: string): Promise<void> {
    const input = this.panel.getByLabel(TEXT_INPUTS[field])
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(input).toHaveAccessibleDescription(message)
  }

  /** US-3.1: option names by their group (the accessibility tree has no option groups) */
  async verifySourceOptions(groups: Record<string, string[]>): Promise<void> {
    const options = await this.panel
      .getByLabel('Source', { exact: true })
      .getByRole('option')
      .evaluateAll((items) =>
        items.map(
          (item) =>
            `${(item.parentElement as HTMLOptGroupElement).label ?? ''}/${item.textContent}`,
        ),
      )
    for (const [group, names] of Object.entries(groups))
      for (const name of names) expect(options).toContain(`${group}/${name}`)
  }

  async verifyColor(name: string): Promise<void> {
    await expect(this.colors.getByRole('radio', { checked: true })).toHaveText(name)
  }

  async verifySaved(): Promise<void> {
    await expect(this.savedStatus).toHaveText('Saved')
  }

  async verifyHistory(stages: string[]): Promise<void> {
    await expect(this.history).toHaveCount(stages.length)
    for (const [index, stage] of stages.entries())
      await expect(this.history.nth(index)).toContainText(stage)
  }

  async verifyNoVacancyButton(): Promise<void> {
    await expect(this.openVacancyButton).toBeHidden()
  }

  async verifyNotes(texts: string[]): Promise<void> {
    await expect(this.notes.getByRole('paragraph')).toHaveText(texts)
  }

  async verifyNoNotes(): Promise<void> {
    await expect(this.notes).toHaveCount(0)
    await expect(this.newNote).toHaveAttribute('placeholder', /^No notes yet/)
  }

  async verifyNoteEdited(text: string): Promise<void> {
    await expect(this.note(text)).toContainText('edited')
  }

  async verifyNoteError(message: string): Promise<void> {
    await expect(this.newNote).toHaveAttribute('aria-invalid', 'true')
    await expect(this.newNote).toHaveAccessibleDescription(message)
  }
}
