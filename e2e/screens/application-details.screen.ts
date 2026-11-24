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

/** Spec 015: the step form as a user types it; date `YYYY-MM-DD`, time `HH:MM` */
export interface NextStepForm {
  text?: string
  date?: string
  time?: string
}

const STEP_INPUTS = { text: 'Step', date: 'Date', time: /^Time/ } as const

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

  private stepSection(): Locator {
    return this.panel.getByRole('region', { name: /^(Next step|Наступний крок)$/ })
  }

  private stepButton(name: string): Locator {
    return this.stepSection().getByRole('button', { name, exact: true })
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

  // ── Next step (spec 015) ───────────────────────────────────────────────

  /** FR-010: "Add next step" (or "Edit"), fill the form, save */
  async addNextStep(form: NextStepForm): Promise<void> {
    await this.stepButton('Add next step').click()
    await this.fillNextStep(form)
  }

  async editNextStep(form: NextStepForm): Promise<void> {
    await this.stepButton('Edit').click()
    await this.fillNextStep(form)
  }

  /** Fills the open step form and saves it */
  async fillNextStep(form: NextStepForm): Promise<void> {
    for (const [field, label] of Object.entries(STEP_INPUTS)) {
      const value = form[field as keyof NextStepForm]
      if (value !== undefined) await this.stepSection().getByLabel(label).fill(value)
    }
    await this.stepButton('Save step').click()
  }

  async completeNextStep(): Promise<void> {
    await this.stepButton('Done').click()
  }

  async removeNextStep(): Promise<void> {
    await this.stepButton('Remove step').click()
  }

  async addStepToCalendar(): Promise<void> {
    await this.stepButton('Add to calendar').click()
  }

  async verifyNextStep(text: string, when: RegExp): Promise<void> {
    const shown = this.stepSection().getByTestId('next-step')
    await expect(shown).toContainText(text)
    await expect(shown).toContainText(when)
  }

  async verifyNoNextStep(): Promise<void> {
    await expect(this.stepSection().getByTestId('next-step')).toHaveCount(0)
    await expect(this.stepButton('Add next step')).toBeVisible()
  }

  /** US-1.3: the error next to a step field */
  async verifyStepError(field: keyof NextStepForm, message: string): Promise<void> {
    const input = this.stepSection().getByLabel(STEP_INPUTS[field])
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(input).toHaveAccessibleDescription(message)
  }

  /** FR-013: opened from the card menu, the focus is on the step */
  async verifyStepFocused(control: 'form' | 'edit'): Promise<void> {
    if (control === 'form') await expect(this.stepSection().getByLabel('Step')).toBeFocused()
    else await expect(this.stepButton('Edit')).toBeFocused()
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

  // ── Stage history (spec 021) ───────────────────────────────────────────

  /** `nth` counts the rows newest first, for a stage that shows more than once */
  private historyDelete(stage: string, nth = 0): Locator {
    return this.panel
      .getByRole('region', { name: 'Stage history' })
      .getByRole('button', { name: new RegExp(`^Delete entry: ${stage}, `) })
      .nth(nth)
  }

  async deleteHistoryEntry(
    stage: string,
    answer: 'confirm' | 'cancel' | 'escape',
    nth = 0,
  ): Promise<void> {
    await this.historyDelete(stage, nth).click()
    await expect(this.confirm).toBeVisible()
    if (answer === 'escape') await this.confirm.press('Escape')
    else
      await this.confirm
        .getByRole('button', { name: answer === 'confirm' ? 'Delete' : 'Cancel' })
        .click()
    await expect(this.confirm).toBeHidden()
  }

  /**
   * US-5: Tab from the colour reaches the delete button of the newest entry, Enter opens
   * the dialog with the focus on Cancel; Tab and Enter delete
   */
  async deleteNewestHistoryEntryWithKeyboard(stage: string): Promise<void> {
    await this.colors.getByRole('radio', { checked: true }).press('Tab')
    const button = this.historyDelete(stage)
    await expect(button).toBeFocused()
    await button.press('Enter')
    const cancel = this.confirm.getByRole('button', { name: 'Cancel' })
    await expect(cancel).toBeFocused()
    await cancel.press('Tab')
    await this.confirm.getByRole('button', { name: 'Delete' }).press('Enter')
    await expect(this.confirm).toBeHidden()
  }

  async verifyHistoryDeleteMessage(stage: string, text: string | RegExp): Promise<void> {
    await this.historyDelete(stage).click()
    await expect(this.confirm).toContainText(text)
    await this.confirm.getByRole('button', { name: 'Cancel' }).click()
  }

  async verifyNoHistoryDelete(): Promise<void> {
    await expect(
      this.panel.getByRole('region', { name: 'Stage history' }).getByRole('button', {
        name: /^Delete entry/,
      }),
    ).toHaveCount(0)
  }

  async verifyHistoryFocused(): Promise<void> {
    await expect(this.panel.getByRole('list', { name: 'Stage history' })).toBeFocused()
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

  async verifyNotes(texts: (string | RegExp)[]): Promise<void> {
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
