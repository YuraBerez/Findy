import { expect, type Locator, type Page } from '@playwright/test'
import { BaseComponent } from 'playwright-e2e-kit'

const SETTINGS_NAME = /^(Settings|Налаштування)$/
const SETTINGS_ITEM = /^(Settings…|Налаштування…)$/

/** Spec 018: the settings window with its side list of categories. */
export class SettingsScreen extends BaseComponent {
  private readonly dialog: Locator
  private readonly appMenuButton: Locator
  private readonly menu: Locator
  private readonly categories: Locator
  private readonly days: Locator

  constructor(page: Page) {
    super(page)
    this.dialog = page.getByRole('dialog', { name: SETTINGS_NAME })
    this.appMenuButton = page
      .getByRole('banner')
      .getByRole('button', { name: /^(App menu|Меню застосунку)$/ })
    this.menu = page.getByRole('menu')
    this.categories = this.dialog.getByRole('tablist')
    this.days = this.dialog.getByLabel(/^(Days in a stage without movement|Днів на етапі без руху)/)
  }

  private category(name: string | RegExp): Locator {
    return this.categories.getByRole('tab', { name })
  }

  private switchNamed(name: string | RegExp): Locator {
    return this.dialog.getByRole('switch', { name })
  }

  // ── Open and close ─────────────────────────────────────────────────────

  /** FR-002: ⋯ → Settings…, then a category if given */
  async open(category?: string | RegExp): Promise<void> {
    if (!(await this.dialog.isVisible())) {
      await this.appMenuButton.click()
      await this.menu.getByRole('menuitem', { name: SETTINGS_ITEM }).click()
      await expect(this.dialog).toBeVisible()
    }
    if (category) await this.chooseCategory(category)
  }

  async close(): Promise<void> {
    await this.dialog.getByRole('button', { name: /^(Close|Закрити)$/ }).click()
    await expect(this.dialog).toBeHidden()
  }

  async closeWithEscape(): Promise<void> {
    await this.dialog.press('Escape')
    await expect(this.dialog).toBeHidden()
  }

  async chooseCategory(name: string | RegExp): Promise<void> {
    await this.category(name).click()
  }

  /** FR-005: ↓ from the selected category */
  async nextCategoryWithKeyboard(): Promise<void> {
    await this.categories.getByRole('tab', { selected: true }).press('ArrowDown')
  }

  // ── General ────────────────────────────────────────────────────────────

  async chooseLanguage(name: 'English' | 'Українська'): Promise<void> {
    await this.dialog.getByLabel(/^(Language|Мова)$/).selectOption({ label: name })
  }

  async chooseTheme(name: string): Promise<void> {
    await this.dialog.getByLabel(/^(Theme|Тема)$/).selectOption({ label: name })
  }

  // ── Board ──────────────────────────────────────────────────────────────

  async setColumnShown(name: string): Promise<void> {
    await this.switchNamed(`Show ${name}`).click()
  }

  async setDays(value: string): Promise<void> {
    await this.days.fill(value)
  }

  /** FR-013: Enter saves */
  async saveDays(value: string): Promise<void> {
    await this.days.fill(value)
    await this.days.press('Enter')
  }

  // ── Switches (Reminders, Updates, AI assistant) ────────────────────────

  async setSwitch(name: string | RegExp, on: boolean): Promise<void> {
    const toggle = this.switchNamed(name)
    if ((await toggle.getAttribute('aria-checked')) !== String(on)) await toggle.click()
    await expect(toggle).toHaveAttribute('aria-checked', String(on))
  }

  // ── AI assistant (specs 004, 016, 017) ─────────────────────────────────

  /** Spec 016 FR-021 */
  async saveSkill(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Save skill…' }).click()
  }

  /** Spec 017 FR-004: with access off, the command block has the only "Copy" button */
  async copySkillCommand(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Copy' }).click()
  }

  /** Spec 016 FR-023 */
  async openSkillInstall(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'How to install' }).click()
  }

  // ── Browser extension (spec 024) ───────────────────────────────────────

  private extensionButton(name: RegExp): Locator {
    return this.dialog.getByRole('tabpanel').getByRole('button', { name })
  }

  async downloadExtension(browser: 'chromium' | 'firefox'): Promise<void> {
    await this.extensionButton(
      browser === 'firefox'
        ? /^(Download for Firefox|Завантажити для Firefox)$/
        : /^(Download for Chrome, Edge and others|Завантажити для Chrome, Edge та інших)$/,
    ).click()
  }

  async openExtensionGuide(): Promise<void> {
    await this.extensionButton(/^(How to install|Як встановити)$/).click()
  }

  /** US-3.2: Tab from the selected category reaches the first download, Enter opens it */
  async downloadExtensionWithKeyboard(): Promise<void> {
    const first = this.extensionButton(/^(Download for Chrome|Завантажити для Chrome)/)
    await expect(first).toBeEnabled()
    await first.focus()
    await first.press('Enter')
  }

  async verifyExtensionText(text: RegExp): Promise<void> {
    await expect(this.dialog.getByRole('tabpanel')).toContainText(text)
  }

  // ── Checks ─────────────────────────────────────────────────────────────

  async verifyOpen(category: string): Promise<void> {
    await expect(this.dialog).toBeVisible()
    await expect(this.categories.getByRole('tab', { selected: true })).toHaveText(category)
  }

  async verifyClosed(): Promise<void> {
    await expect(this.dialog).toBeHidden()
  }

  async verifyCategories(names: string[]): Promise<void> {
    await expect(this.categories.getByRole('tab')).toHaveText(names)
  }

  /** The heading of the shown page */
  async verifyPage(title: string): Promise<void> {
    await expect(
      this.dialog.getByRole('tabpanel').getByRole('heading', { level: 3 }).first(),
    ).toHaveText(title)
  }

  async verifyLanguage(name: string): Promise<void> {
    await expect(
      this.dialog.getByLabel(/^(Language|Мова)$/).getByRole('option', { selected: true }),
    ).toHaveText(name)
  }

  async verifyTheme(name: string): Promise<void> {
    await expect(
      this.dialog.getByLabel(/^(Theme|Тема)$/).getByRole('option', { selected: true }),
    ).toHaveText(name)
  }

  async verifyColumnSwitch(
    name: string,
    state: { on: boolean; enabled?: boolean; count?: string },
  ): Promise<void> {
    const toggle = this.switchNamed(`Show ${name}`)
    await expect(toggle).toHaveAttribute('aria-checked', String(state.on))
    if (state.enabled !== undefined) {
      if (state.enabled) await expect(toggle).toBeEnabled()
      else await expect(toggle).toBeDisabled()
    }
    if (state.count)
      await expect(this.dialog.getByRole('listitem').filter({ hasText: name })).toContainText(
        state.count,
      )
  }

  async verifyDays(value: string): Promise<void> {
    await expect(this.days).toHaveValue(value)
  }

  async verifyDaysError(message: string): Promise<void> {
    await expect(this.days).toHaveAttribute('aria-invalid', 'true')
    await expect(this.days).toHaveAccessibleDescription(new RegExp(message))
  }

  async verifySwitch(name: string | RegExp, on: boolean): Promise<void> {
    await expect(this.switchNamed(name)).toHaveAttribute('aria-checked', String(on))
  }

  /** Spec 004 FR-009: ready-to-copy client configuration */
  async verifyAssistantInstructions(): Promise<void> {
    const config = this.dialog.getByTestId('mcp-desktop-config')
    await expect(config).toContainText('"mcpServers"')
    await expect(config).toContainText('"ELECTRON_RUN_AS_NODE": "1"')
    await expect(this.dialog).toContainText('claude mcp add findy -e ELECTRON_RUN_AS_NODE=1 --')
  }

  /** Spec 003: no instructions when main could not give the connection */
  async verifyNoAssistantInstructions(): Promise<void> {
    await expect(this.dialog.getByTestId('mcp-desktop-config')).toHaveCount(0)
  }

  async verifySkillCommand(text: RegExp): Promise<void> {
    await expect(this.dialog.getByLabel('Install the skill in Claude Code')).toHaveText(text)
  }

  /** NFR-003: the window and the page fit; one scroll area */
  async verifyFitsWindow(): Promise<void> {
    await expect(this.dialog).toBeInViewport({ ratio: 1 })
  }
}
