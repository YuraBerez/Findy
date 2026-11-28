import { expect, type Locator, type Page } from '@playwright/test'
import { BaseComponent } from 'playwright-e2e-kit'
import { SettingsScreen } from './settings.screen'

const AUTO_CHECK = /^(Check for updates automatically|Автоматично перевіряти оновлення)$/

/** Spec 006: the update check in the app menu, its switch in Settings, the update dialog. */
export class UpdatesScreen extends BaseComponent {
  private readonly appMenuButton: Locator
  private readonly menu: Locator
  private readonly dialog: Locator
  private readonly settings: SettingsScreen

  constructor(page: Page) {
    super(page)
    this.appMenuButton = page
      .getByRole('banner')
      .getByRole('button', { name: /^(App menu|Меню застосунку|Menu aplikacji)$/ })
    this.menu = page.getByRole('menu')
    this.dialog = page.getByTestId('update-dialog')
    this.settings = new SettingsScreen(page)
  }

  /** US-1: app menu → "Check for updates…" */
  async checkNow(): Promise<void> {
    await this.appMenuButton.click()
    await this.menu
      .getByRole('menuitem', { name: /^(Check for updates…|Перевірити оновлення…)$/ })
      .click()
  }

  /** US-2, spec 018: Settings → Updates → the switch, then close the window */
  async setAutoCheck(on: boolean): Promise<void> {
    await this.settings.open(/^(Updates|Оновлення)$/)
    await this.settings.setSwitch(AUTO_CHECK, on)
    await this.settings.close()
  }

  async verifyAutoCheck(on: boolean): Promise<void> {
    await this.settings.open(/^(Updates|Оновлення)$/)
    await this.settings.verifySwitch(AUTO_CHECK, on)
    await this.settings.close()
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
