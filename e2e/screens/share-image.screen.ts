import { expect, type Locator, type Page } from '@playwright/test'
import { BaseComponent } from 'playwright-e2e-kit'

/** What the text alternative of the image says (spec 023 plan D-5) */
export interface ImageText {
  heading: string
  tiles: [label: string, value: string][]
  funnel: string[]
}

/** Spec 023: the share button of the analytics screen and the image preview. */
export class ShareImageScreen extends BaseComponent {
  private readonly panel: Locator
  private readonly button: Locator
  private readonly grouping: Locator
  private readonly dialog: Locator
  private readonly image: Locator
  private readonly text: Locator

  constructor(page: Page) {
    super(page)
    this.panel = page.getByRole('tabpanel', { name: /^(Analytics|Аналітика)$/ })
    this.button = this.panel.getByRole('button', {
      name: /^(Share image|Поділитися зображенням)$/,
    })
    this.grouping = this.panel.getByLabel(/^(Group by|Групувати)$/)
    this.dialog = page.getByTestId('share-image')
    this.image = this.dialog.getByRole('img')
    this.text = this.dialog.getByTestId('share-image-text')
  }

  private get copyButton(): Locator {
    return this.dialog.getByRole('button', { name: /^(Copy|Копіювати)$/ })
  }

  private get saveButton(): Locator {
    return this.dialog.getByRole('button', { name: /^(Save as PNG|Зберегти як PNG)$/ })
  }

  async open(): Promise<void> {
    await this.button.click()
    await expect(this.dialog).toBeVisible()
  }

  /** US-3.1: Tab from the grouping filter, then Enter */
  async openWithKeyboard(): Promise<void> {
    await this.grouping.press('Tab')
    await expect(this.button).toBeFocused()
    await this.button.press('Enter')
    await expect(this.dialog).toBeVisible()
  }

  async copy(): Promise<void> {
    await this.copyButton.click()
  }

  async save(): Promise<void> {
    await this.saveButton.click()
  }

  /** The "Close" button of the footer (the × in the header has the same name) */
  async close(): Promise<void> {
    await this.dialog
      .getByRole('button', { name: /^(Close|Закрити)$/ })
      .last()
      .click()
  }

  async pressEscape(): Promise<void> {
    await this.dialog.press('Escape')
  }

  /** FR-001: in the row of the filters, on their right side */
  async verifyButtonRightOfFilters(): Promise<void> {
    const button = await this.button.boundingBox()
    const grouping = await this.grouping.boundingBox()
    expect(button && grouping && button.x).toBeGreaterThan(grouping!.x + grouping!.width - 1)
    expect(Math.abs(button!.y + button!.height - (grouping!.y + grouping!.height))).toBeLessThan(2)
  }

  /** FR-002 */
  async verifyButtonHidden(): Promise<void> {
    await expect(this.button).toHaveCount(0)
  }

  async verifyButtonFocused(): Promise<void> {
    await expect(this.dialog).toBeHidden()
    await expect(this.button).toBeFocused()
  }

  /** US-3.2: focus starts on Copy; Shift+Tab moves to Save as PNG, then to Close */
  async verifyFocusInDialog(): Promise<void> {
    const close = this.dialog.getByRole('button', { name: /^(Close|Закрити)$/ }).last()
    await expect(this.copyButton).toBeFocused()
    await this.copyButton.press('Shift+Tab')
    await expect(this.saveButton).toBeFocused()
    await this.saveButton.press('Shift+Tab')
    await expect(close).toBeFocused()
  }

  async verifyOpen(): Promise<void> {
    await expect(this.dialog).toBeVisible()
  }

  /** FR-010: a 1080 × 1080 PNG */
  async verifyImageSize(): Promise<void> {
    await expect(this.image).toHaveAttribute('src', /^data:image\/png;base64,/)
    const size = await this.image.evaluate(async (node: HTMLImageElement) => {
      await node.decode()
      return [node.naturalWidth, node.naturalHeight]
    })
    expect(size).toEqual([1080, 1080])
  }

  /** FR-014: the background of the image is the light surface, also in the dark theme */
  async verifyImageLight(): Promise<void> {
    const pixel = await this.image.evaluate(async (node: HTMLImageElement) => {
      await node.decode()
      const canvas = document.createElement('canvas')
      canvas.width = node.naturalWidth
      canvas.height = node.naturalHeight
      const context = canvas.getContext('2d')!
      context.drawImage(node, 0, 0)
      return [...context.getImageData(20, 60, 1, 1).data]
    })
    expect(pixel).toEqual([255, 255, 255, 255])
  }

  /** FR-011…FR-013, FR-015, SC-002: the text, the numbers and the order of the image */
  async verifyImageText({ heading, tiles, funnel }: ImageText): Promise<void> {
    await expect(this.text.getByRole('paragraph').first()).toHaveText(heading)
    await expect(this.text.getByRole('term')).toHaveText(tiles.map(([label]) => label))
    await expect(this.text.getByRole('definition')).toHaveText(tiles.map(([, value]) => value))
    await expect(this.text.getByRole('listitem')).toHaveText(funnel)
  }
}
