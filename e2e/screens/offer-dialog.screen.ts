import { expect, type Locator, type Page } from '@playwright/test'
import { BaseComponent } from 'playwright-e2e-kit'

type Answer = 'Yes' | 'Not really' | "Don't ask again"
type Link = 'Support on Ko-fi' | 'Star on GitHub' | 'Tell us what to improve'

/** Spec 013: the dialog after a move to Offer, in English. */
export class OfferDialogScreen extends BaseComponent {
  private readonly dialog: Locator
  private readonly confetti: Locator

  constructor(page: Page) {
    super(page)
    this.dialog = page.getByTestId('offer-dialog')
    this.confetti = page.getByTestId('confetti')
  }

  /** US-3.1: it plays, then it is gone after at most 3 s (FR-010) */
  async verifyConfetti(): Promise<void> {
    await expect(this.confetti).toBeVisible()
    await expect(this.confetti).toHaveCount(0, { timeout: 5_000 })
  }

  /** FR-012 */
  async verifyNoConfetti(): Promise<void> {
    await expect(this.confetti).toHaveCount(0)
  }

  /** US-1.1, FR-009: the question, with the focus on Yes */
  async verifyAsked(): Promise<void> {
    await expect(this.dialog.getByRole('heading')).toHaveText('Congratulations on your offer!')
    await expect(this.dialog).toContainText('Did Findy help with your job search?')
    await expect(this.dialog.getByRole('button', { name: 'Yes' })).toBeFocused()
  }

  async verifyNoDialog(): Promise<void> {
    await expect(this.dialog).toHaveCount(0)
  }

  async answer(answer: Answer): Promise<void> {
    await this.dialog.getByRole('button', { name: answer, exact: true }).click()
  }

  /** US-1.4, D-7: the close button closes without an answer */
  async close(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Close' }).click()
  }

  /** US-1.4: Escape closes without an answer */
  async closeWithEscape(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Yes' }).press('Escape')
  }

  /** US-1.2, US-1.3: the next step and its links */
  async verifyStep(title: string, links: Link[]): Promise<void> {
    await expect(this.dialog.getByRole('heading')).toHaveText(title)
    for (const link of links)
      await expect(this.dialog.getByRole('button', { name: link })).toBeVisible()
  }

  /** D-7: there is no "Not now" answer */
  async verifyNoNotNow(): Promise<void> {
    await expect(this.dialog.getByRole('button', { name: 'Not now' })).toHaveCount(0)
  }

  /** Text expansion: every button of the question fits the window, in any language */
  async verifyButtonsInWindow(): Promise<void> {
    const buttons = this.dialog.getByRole('button')
    await expect(buttons).toHaveCount(4)
    for (const button of await buttons.all()) await expect(button).toBeInViewport({ ratio: 1 })
  }

  async open(link: Link): Promise<void> {
    await this.dialog.getByRole('button', { name: link }).click()
  }
}
