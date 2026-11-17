import { expect, type Locator, type Page } from '@playwright/test'
import { BaseComponent } from 'playwright-e2e-kit'
import type { ApplicationForm } from './application-dialog.screen'

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
