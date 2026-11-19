import { expect, type Locator, type Page } from '@playwright/test'
import { BaseComponent } from 'playwright-e2e-kit'

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Spec 011: the Sites tab. Names match English and Ukrainian. */
export class SitesScreen extends BaseComponent {
  private readonly panel: Locator
  private readonly query: Locator
  private readonly menu: Locator
  private readonly dialog: Locator

  constructor(page: Page) {
    super(page)
    this.panel = page.getByRole('tabpanel', { name: /^(Sites|Сайти)$/ })
    this.query = this.panel.getByRole('searchbox', { name: /^(Search query|Пошуковий запит)/ })
    this.menu = page.getByRole('menu')
    this.dialog = page.getByRole('dialog', {
      name: /^(New site|Edit site|Новий сайт|Змінити сайт)$/,
    })
  }

  private group(name: string): Locator {
    return this.panel.getByRole('region', { name })
  }

  /** The tile's open button: its name starts with the site name */
  private tile(name: string): Locator {
    return this.panel.getByRole('button', { name: new RegExp(`^${escape(name)} `) })
  }

  private actions(name: string): Locator {
    return this.panel.getByRole('button', {
      name: new RegExp(`^(Actions for |Дії для «)${escape(name)}»?$`),
    })
  }

  // ── Query and opening (US-1) ───────────────────────────────────────────

  async setQuery(text: string): Promise<void> {
    await this.query.fill(text)
    await this.query.blur() // FR-005: saved when the field loses focus
  }

  async verifyQuery(text: string): Promise<void> {
    await expect(this.query).toHaveValue(text)
  }

  async openSite(name: string): Promise<void> {
    await this.tile(name).click()
  }

  /** US-5.1: Tab from the query field reaches the first tile; Enter opens it */
  async openFirstSiteWithKeyboard(name: string): Promise<void> {
    await this.query.press('Tab')
    await expect(this.tile(name)).toBeFocused()
    await this.tile(name).press('Enter')
  }

  async verifyGroups(names: string[]): Promise<void> {
    await expect(this.panel.getByRole('heading', { level: 2 })).toHaveText(names)
  }

  /** FR-004: the tiles of a group, by name, in order */
  async verifyTiles(group: string, names: string[]): Promise<void> {
    const tiles = this.group(group).getByRole('listitem')
    await expect(tiles).toHaveCount(names.length)
    for (const [index, name] of names.entries())
      await expect(tiles.nth(index).getByRole('button').first()).toHaveAccessibleName(
        new RegExp(`^${escape(name)} `),
      )
  }

  async verifyNoTile(name: string): Promise<void> {
    await expect(this.tile(name)).toHaveCount(0)
  }

  /** FR-020: an icon image, or the letter */
  async verifyIcon(name: string, image: boolean): Promise<void> {
    // The icon is decorative (alt=""), so it has no role: found by its test id
    const img = this.tile(name).getByTestId('site-icon')
    if (image) await expect(img).toHaveCount(1)
    else await expect(img).toHaveCount(0)
  }

  // ── Actions (US-2, US-3) ───────────────────────────────────────────────

  private async chooseAction(site: string, action: RegExp): Promise<void> {
    await this.actions(site).click()
    await this.menu.getByRole('menuitem', { name: action }).click()
  }

  async hide(site: string): Promise<void> {
    await this.chooseAction(site, /^(Hide|Сховати)$/)
  }

  async verifyHiddenToggle(count: number | null): Promise<void> {
    const toggle = this.panel.getByRole('button', {
      name: /^(Show hidden sites|Показати сховані сайти)/,
    })
    if (count === null) await expect(toggle).toHaveCount(0)
    else await expect(toggle).toHaveText(new RegExp(`\\(${count}\\)$`))
  }

  async showHidden(site: string): Promise<void> {
    await this.panel
      .getByRole('button', { name: /^(Show hidden sites|Показати сховані сайти)/ })
      .click()
    await this.panel
      .getByRole('button', { name: new RegExp(`^(Show|Показати) «?${escape(site)}»?$`) })
      .click()
  }

  async startAdding(): Promise<void> {
    await this.panel.getByRole('button', { name: /^(Add site|Додати сайт)$/ }).click()
  }

  async startEditing(site: string): Promise<void> {
    await this.chooseAction(site, /^(Edit|Змінити)$/)
  }

  async fillSite(form: { name?: string; url?: string }): Promise<void> {
    if (form.name !== undefined) await this.dialog.getByLabel(/^(Name|Назва)$/).fill(form.name)
    if (form.url !== undefined) await this.dialog.getByLabel(/^(Address|Адреса)/).fill(form.url)
  }

  async saveSite(): Promise<void> {
    await this.dialog.getByRole('button', { name: /^(Save|Зберегти)$/ }).click()
  }

  async verifyDialogClosed(): Promise<void> {
    await expect(this.dialog).toBeHidden()
  }

  async verifySiteError(field: 'name' | 'url', message: string): Promise<void> {
    const input =
      field === 'name'
        ? this.dialog.getByLabel(/^(Name|Назва)$/)
        : this.dialog.getByLabel(/^(Address|Адреса)/)
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(input).toHaveAccessibleDescription(new RegExp(escape(message)))
  }

  async cancelSite(): Promise<void> {
    await this.dialog.getByRole('button', { name: /^(Cancel|Скасувати)$/ }).click()
  }

  /** FR-011: Delete asks first */
  async delete(site: string, confirm: boolean): Promise<void> {
    await this.chooseAction(site, /^(Delete|Видалити)$/)
    const ask = this.page.getByRole('alertdialog', {
      name: /^(Delete this site\?|Видалити цей сайт\?)$/,
    })
    await expect(ask).toBeVisible()
    await ask
      .getByRole('button', { name: confirm ? /^(Delete|Видалити)$/ : /^(Cancel|Скасувати)$/ })
      .click()
    await expect(ask).toBeHidden()
  }
}
