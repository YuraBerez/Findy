import { expect, type Locator, type Page } from '@playwright/test'
import { BaseComponent } from 'playwright-e2e-kit'

/** Spec 006: the update entries of the app menu and the update dialog. */
export class UpdatesScreen extends BaseComponent {
  private readonly appMenuButton: Locator
  private readonly menu: Locator
  private readonly dialog: Locator

  constructor(page: Page) {
    super(page)
    this.appMenuButton = page
      .getByRole('banner')
      .getByRole('button', { name: /^(App menu|Меню застосунку)$/ })
    this.menu = page.getByRole('menu')
    this.dialog = page.getByTestId('update-dialog')
  }

  private autoSwitch(): Locator {
    return this.menu.getByRole('menuitemcheckbox', {
      name: /^(Check for updates automatically|Автоматично перевіряти оновлення)$/,
    })
  }

  /** US-1: app menu → "Check for updates…" */
  async checkNow(): Promise<void> {
    await this.appMenuButton.click()
    await this.menu
      .getByRole('menuitem', { name: /^(Check for updates…|Перевірити оновлення…)$/ })
      .click()
  }

  /** US-2: flip the automatic check in the app menu, then close the menu */
  async setAutoCheck(on: boolean): Promise<void> {
    await this.appMenuButton.click()
    if ((await this.autoSwitch().getAttribute('aria-checked')) !== String(on))
      await this.autoSwitch().click()
    await expect(this.autoSwitch()).toHaveAttribute('aria-checked', String(on))
    await this.appMenuButton.click()
    await expect(this.menu).toBeHidden()
  }

  async verifyAutoCheck(on: boolean): Promise<void> {
    await this.appMenuButton.click()
    await expect(this.autoSwitch()).toHaveAttribute('aria-checked', String(on))
    await this.appMenuButton.click()
  }

  /** FR-007: the versions in the dialog */
  async verifyAvailable(version: string): Promise<void> {
    await expect(this.dialog).toBeVisible()
    await expect(this.dialog.getByRole('heading')).toHaveText('Update available')
    await expect(this.dialog).toContainText(
      new RegExp(
        `Version ${version.replace(/\./g, '\\.')} is available\\. You have \\d+\\.\\d+\\.\\d+`,
      ),
    )
  }

  async verifyLatest(): Promise<void> {
    await expect(this.dialog.getByRole('heading')).toHaveText('No updates')
    await expect(this.dialog).toContainText(/You have the latest version \(\d+\.\d+\.\d+\)/)
  }

  async verifyNoDialog(): Promise<void> {
    await expect(this.dialog).toHaveCount(0)
  }

  async download(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Download' }).click()
  }

  async later(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Later' }).click()
  }

  async closeWithEscape(): Promise<void> {
    await this.dialog.getByRole('button').first().press('Escape')
  }
}
