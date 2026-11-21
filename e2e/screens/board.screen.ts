import { expect, type Locator, type Page } from '@playwright/test'
import { BaseComponent, escapeRegExp } from 'playwright-e2e-kit'
import type { CardColor, StageId } from '../../src/shared/ipc'
import type { Pointer } from './pointer'
import { SettingsScreen } from './settings.screen'

/** Light and dark `--bg` (src/renderer/styles/global.css) */
const BACKGROUND = { light: 'rgb(244, 246, 248)', dark: 'rgb(22, 24, 28)' } as const

/**
 * The main window: toolbar, stage columns, cards and their menus.
 * Electron has no routes, so this is a component of the one window, not a routed screen.
 */
export class BoardScreen extends BaseComponent {
  private readonly appRoot: Locator
  private readonly toolbar: Locator
  private readonly addButton: Locator
  private readonly appMenuButton: Locator
  private readonly board: Locator
  private readonly emptyState: Locator
  private readonly storageError: Locator
  private readonly menu: Locator
  private readonly searchInput: Locator
  private readonly settings: SettingsScreen

  constructor(
    page: Page,
    private readonly pointer: Pointer,
  ) {
    super(page)
    this.appRoot = page.getByTestId('app')
    this.toolbar = page.getByRole('banner')
    this.addButton = this.toolbar.getByRole('button', { name: /^(Add application|Додати заявку)$/ })
    this.appMenuButton = this.toolbar.getByRole('button', { name: /^(App menu|Меню застосунку)$/ })
    this.board = page.getByRole('list', { name: /^(Job applications board|Дошка заявок)$/ })
    this.emptyState = page.getByTestId('empty-board')
    this.storageError = page.getByTestId('storage-error')
    this.menu = page.getByRole('menu')
    this.searchInput = this.toolbar.getByRole('searchbox', { name: 'Search applications' })
    this.settings = new SettingsScreen(page)
  }

  private column(stage: StageId): Locator {
    return this.page.getByTestId(`column-${stage}`)
  }

  private cardsIn(stage: StageId): Locator {
    return this.column(stage).getByTestId('card')
  }

  /** The draggable part of a card: a button named by its text, title first. */
  private card(title: string, scope: Locator = this.board): Locator {
    return scope.getByRole('button', { name: new RegExp(`^${escapeRegExp(title)}(\\s|$)`) })
  }

  /** The whole card (article) around the handle */
  private cardBox(title: string): Locator {
    return this.board.getByTestId('card').filter({ hasText: title })
  }

  private cardActions(title: string): Locator {
    return this.page.getByRole('button', {
      name: new RegExp(`^(Actions for |Дії для «)${escapeRegExp(title)}»?$`),
    })
  }

  // ── Toolbar ────────────────────────────────────────────────────────────

  async startAdding(): Promise<void> {
    await this.addButton.click()
  }

  async startAddingFromEmptyState(): Promise<void> {
    await this.emptyState.getByRole('button').click()
  }

  /** Spec 018: General → Theme in Settings, then close the window */
  async chooseTheme(name: string): Promise<void> {
    await this.settings.open(/^(General|Загальні)$/)
    await this.settings.chooseTheme(name)
    await this.settings.close()
  }

  /** US-5, spec 018: General → Language in Settings, then close the window */
  async chooseLanguage(name: 'English' | 'Українська'): Promise<void> {
    await this.settings.open(/^(General|Загальні)$/)
    await this.settings.chooseLanguage(name)
    await this.settings.close()
  }

  /** Spec 018 FR-002: the native menu item and its accelerator open the window */
  async verifySettingsOpen(): Promise<void> {
    await this.settings.verifyOpen('General')
  }

  /** Spec 018 FR-020: the items of the app menu, in order */
  async verifyAppMenu(items: string[]): Promise<void> {
    await this.openAppMenu()
    await expect(this.menu.getByRole('menuitem')).toHaveText(items)
    await this.closeAppMenu()
  }

  async closeAppMenu(): Promise<void> {
    await this.appMenuButton.click()
    await expect(this.menu).toBeHidden()
  }

  private appMenuItem(name: string | RegExp): Locator {
    return this.menu.getByRole('menuitem', { name })
  }

  async openAppMenu(): Promise<void> {
    await this.appMenuButton.click()
    await expect(this.menu).toBeVisible()
  }

  /** Spec 013 FR-007: app menu → Support Findy… */
  async supportFindy(): Promise<void> {
    await this.openAppMenu()
    await this.appMenuItem(/^(Support Findy…|Підтримати Findy…)$/).click()
  }

  // ── Spec 015: next step ────────────────────────────────────────────────

  /** FR-020: the visible mark text; null = no mark */
  async verifyStepMark(title: string, mark: RegExp | null): Promise<void> {
    const shown = this.card(title).getByTestId('card-next-step')
    if (mark === null) await expect(shown).toHaveCount(0)
    else await expect(this.card(title).getByTestId('card-next-step-text')).toHaveText(mark)
  }

  /** FR-022: the step is in the card's accessible name */
  async verifyStepInName(title: string, text: RegExp): Promise<void> {
    await expect(this.card(title)).toHaveAccessibleName(text)
  }

  /** FR-021: overdue has its own icon state, not only a colour */
  async verifyStepOverdue(title: string): Promise<void> {
    await expect(this.card(title).getByTestId('card-next-step')).toHaveAttribute(
      'data-status',
      'overdue',
    )
  }

  /** FR-013: card ⋯ → Next step… */
  async openStepFromMenu(title: string): Promise<void> {
    await this.openCardMenu(title)
    await this.menu.getByRole('menuitem', { name: /^(Next step…|Наступний крок…)$/ }).click()
  }

  // ── Spec 010: stale applications ───────────────────────────────────────

  /** FR-003: the mark is text in the card's accessible name, or there is none */
  async verifyStaleMark(title: string, mark: string | null): Promise<void> {
    if (mark) await expect(this.card(title)).toHaveAccessibleName(new RegExp(` ${mark} `))
    else await expect(this.card(title)).not.toHaveAccessibleName(/No movement|Без руху/)
  }

  /** Spec 008 US-1: app menu → Export to CSV… (the save dialog is answered by the test) */
  async exportCsv(): Promise<void> {
    await this.openAppMenu()
    await this.appMenuItem(/^(Export to CSV…|Експорт у CSV…)$/).click()
  }

  /** Spec 008 US-2: app menu → Import from CSV… */
  async importCsv(): Promise<void> {
    await this.openAppMenu()
    await this.appMenuItem(/^(Import from CSV…|Імпорт із CSV…)$/).click()
  }

  /**
   * Spec 008 US-3.1: Enter opens the menu, End goes to "Reset board…" (the board must
   * have cards), ↑ walks up past "Support Findy…" and "Check for updates…" to "Import from
   * CSV…", Enter picks it.
   */
  async importCsvWithKeyboard(): Promise<void> {
    await this.appMenuButton.press('Enter')
    await expect(this.menu).toBeVisible()
    const path = [
      this.appMenuItem('Reset board…'),
      this.appMenuItem('Support Findy…'),
      this.appMenuItem('Check for updates…'),
    ]
    await this.menu.getByRole('menuitem').first().press('End')
    for (const item of path) {
      await expect(item).toBeFocused()
      await item.press('ArrowUp')
    }
    const target = this.appMenuItem('Import from CSV…')
    await expect(target).toBeFocused()
    await target.press('Enter')
  }

  async verifyExportDisabled(): Promise<void> {
    await this.openAppMenu()
    await expect(this.appMenuItem(/^(Export to CSV…|Експорт у CSV…)$/)).toBeDisabled()
    await this.closeAppMenu()
  }

  /** US-10: app menu → Reset board… → confirm or cancel */
  async resetBoard(answer: 'confirm' | 'cancel'): Promise<void> {
    if ((await this.page.getByRole('alertdialog').count()) === 0) await this.startReset()
    const confirm = this.page.getByRole('alertdialog', { name: 'Reset the board?' })
    await confirm
      .getByRole('button', { name: answer === 'confirm' ? 'Reset board' : 'Cancel' })
      .click()
    await expect(confirm).toBeHidden()
  }

  // ── Search (US-8) ───────────────────────────────────────────────────────

  async search(text: string): Promise<void> {
    await this.searchInput.fill(text)
  }

  async clearSearchWithEscape(): Promise<void> {
    await this.searchInput.press('Escape')
  }

  /** Cmd+F on macOS, Ctrl+F elsewhere, from anywhere on the board */
  async focusSearchWithShortcut(): Promise<void> {
    await this.board.press('ControlOrMeta+f')
  }

  async verifySearch(value: string, focused = false): Promise<void> {
    await expect(this.searchInput).toHaveValue(value)
    if (focused) await expect(this.searchInput).toBeFocused()
  }

  async verifyNoResults(query: string): Promise<void> {
    await expect(
      this.page.getByRole('status').filter({ hasText: `No applications match “${query}”.` }),
    ).toBeVisible()
  }

  /** FR-074 */
  async reportIssue(): Promise<void> {
    await this.page.getByRole('button', { name: /^(Found an issue\?|Знайшли проблему\?)$/ }).click()
  }

  // ── Notifications (spec 003) ───────────────────────────────────────────

  async closeNotification(text: string): Promise<void> {
    await this.page
      .getByTestId('toast')
      .filter({ hasText: text })
      .getByRole('button', { name: 'Close' })
      .click()
  }

  async verifyNotification(text: string): Promise<void> {
    await expect(this.page.getByRole('alert').filter({ hasText: text })).toBeVisible()
  }

  /** Spec 008 FR-008: a success message (a status, not an alert) */
  async verifyInfo(text: string): Promise<void> {
    await expect(this.page.getByRole('status').filter({ hasText: text })).toBeVisible()
  }

  async verifyNoNotification(): Promise<void> {
    await expect(this.page.getByTestId('toast')).toHaveCount(0)
  }

  // ── Columns (spec 002) ─────────────────────────────────────────────────

  async hideColumn(stage: StageId, name: string): Promise<void> {
    await this.column(stage)
      .getByRole('button', { name: `Hide column ${name}` })
      .click()
  }

  async verifyNoHideButton(stage: StageId): Promise<void> {
    await expect(this.column(stage).getByRole('button', { name: /^Hide column/ })).toHaveCount(0)
  }

  async verifyColumnHidden(stage: StageId): Promise<void> {
    await expect(this.column(stage)).toHaveCount(0)
  }

  /** Opens the confirmation and leaves it open */
  async startReset(): Promise<void> {
    await this.openAppMenu()
    await this.appMenuItem('Reset board…').click()
  }

  async verifyResetConfirmation(message: string): Promise<void> {
    const confirm = this.page.getByRole('alertdialog', { name: 'Reset the board?' })
    await expect(confirm).toContainText(message)
    // FR-091: Cancel is the default action
    await expect(confirm.getByRole('button', { name: 'Cancel' })).toBeFocused()
  }

  async verifyResetDisabled(): Promise<void> {
    await this.openAppMenu()
    await expect(this.appMenuItem('Reset board…')).toBeDisabled()
    await this.appMenuButton.click() // close it again
    await expect(this.menu).toBeHidden()
  }

  // ── Cards ──────────────────────────────────────────────────────────────

  /**
   * Drags a card onto a column (its free space) or in front of another card.
   * "In front of" drops into the gap just above that card: cards shift while the
   * drag runs, but the card below the gap stays the closest one.
   */
  async dragCard(
    title: string,
    target: { stage: StageId } | { before: string; in: StageId },
  ): Promise<void> {
    const column = this.column('stage' in target ? target.stage : target.in)
    const columnBox = await column.boundingBox()
    if (!columnBox) throw new Error('Drop column is not visible')
    let y = columnBox.height * 0.6
    if ('before' in target) {
      const cardBox = await this.card(target.before).boundingBox()
      if (!cardBox) throw new Error('Drop card is not visible')
      // Inside the top of the card, not in the gap above it: a gap can resolve to
      // the next card under load
      y = cardBox.y - columnBox.y + cardBox.height * 0.25
    }
    const to = { x: columnBox.x + columnBox.width / 2, y: columnBox.y + y }
    await this.pointer.drag(this.card(title), to, {
      started: () => expect(this.page.getByTestId('drag-preview')).toBeVisible(),
      // The drop is ready when the app shows it: the card's preview is in the target
      // column, and in front of the right card when there is one
      ready: async () => {
        await expect(this.card(title, column)).toHaveCount(1)
        if ('before' in target)
          await expect(this.card(target.before)).toHaveAttribute('data-over', 'true')
      },
    })
  }

  /** FR-025: a click on the card opens its details */
  async openCard(title: string): Promise<void> {
    await this.card(title).click()
  }

  async openCardWithEnter(title: string): Promise<void> {
    await this.card(title).press('Enter')
  }

  /** FR-016 */
  async openVacancyFromCard(title: string): Promise<void> {
    await this.page.getByRole('button', { name: `Open the vacancy for ${title}` }).click()
  }

  async verifyVacancyButton(title: string, shown: boolean): Promise<void> {
    const button = this.page.getByRole('button', { name: `Open the vacancy for ${title}` })
    if (shown) await expect(button).toBeVisible()
    else await expect(button).toBeHidden()
  }

  async verifyCardFocusedAnywhere(title: string): Promise<void> {
    await expect(this.card(title)).toBeFocused()
  }

  async moveWithMenu(title: string, stageName: string): Promise<void> {
    await this.openCardMenu(title)
    await this.menu.getByRole('menuitem', { name: stageName }).click()
  }

  /** Spec 007 US-1: ⋯ → Colour › → a colour (or "None") */
  async colorWithMenu(title: string, colorName: string): Promise<void> {
    await this.openCardMenu(title)
    await this.colorItem().click()
    await this.colorOption(colorName).click()
    await expect(this.menu).toBeHidden()
  }

  private colorItem(): Locator {
    return this.menu.getByRole('menuitem', { name: /^(Colour|Колір)/ })
  }

  private colorOption(name: string): Locator {
    return this.menu.getByRole('menuitemradio', { name })
  }

  /**
   * Spec 007 US-1.6: Enter opens the menu, End goes to "Colour", → opens it with focus on
   * the current colour (`path[0]`), ↓ walks the path, Enter selects its last option.
   */
  async colorWithKeyboard(title: string, path: string[]): Promise<void> {
    await this.openCardMenuWithKeyboard(title)
    await this.menu.getByRole('menuitem').first().press('End')
    await expect(this.colorItem()).toBeFocused()
    await this.colorItem().press('ArrowRight')
    for (const [index, name] of path.entries()) {
      await expect(this.colorOption(name)).toBeFocused()
      await this.colorOption(name).press(index === path.length - 1 ? 'Enter' : 'ArrowDown')
    }
    await expect(this.menu).toBeHidden()
  }

  async openCardMenuWithKeyboard(title: string): Promise<void> {
    await this.cardActions(title).press('Enter')
  }

  /**
   * dnd-kit swallows clicks for ~50 ms after a drop (so the mouse-up is not a click).
   * A person never notices; a test right after a drag does, so click until it opens.
   */
  async openCardMenu(title: string): Promise<void> {
    await expect(async () => {
      if ((await this.cardActions(title).getAttribute('aria-expanded')) !== 'true') {
        await this.cardActions(title).click()
      }
      await expect(this.menu).toBeVisible({ timeout: 1_000 })
    }).toPass()
  }

  /** Presses a key on the menu item that has focus now. */
  async pressInMenu(focusedItem: string, key: string): Promise<void> {
    await this.menu.getByRole('menuitem', { name: focusedItem }).press(key)
  }

  /**
   * FR-021: keyboard drag-and-drop. Space picks up the card; each arrow moves it one
   * column; Space drops it. Waits until the card shows in each column it passes.
   */
  async moveWithKeyboard(
    title: string,
    from: StageId,
    steps: { key: 'ArrowLeft' | 'ArrowRight'; reaches: StageId }[],
  ): Promise<void> {
    const card = this.card(title)
    await card.press('Space')
    // dnd-kit marks the picked-up card; arrows before that are ignored
    await expect(card).toHaveAttribute('aria-pressed', 'true')
    let current = from
    for (const step of steps) {
      // dnd-kit attaches its key listener in a timeout after pick-up, so on a busy
      // machine the first arrow can be lost. Press again only while the card is
      // still in the previous column: it can never move twice.
      await expect(async () => {
        if ((await this.card(title, this.column(current)).count()) > 0) await card.press(step.key)
        await expect(this.card(title, this.column(step.reaches))).toHaveCount(1, { timeout: 1_000 })
      }).toPass()
      current = step.reaches
    }
    await card.press('Space')
    await expect(card).not.toHaveAttribute('aria-pressed', 'true')
  }

  // ── Checks ─────────────────────────────────────────────────────────────

  async verifyShown(): Promise<void> {
    await expect(this.toolbar).toContainText('Findy')
    await expect(this.board).toBeVisible()
  }

  async verifyStageNames(names: string[]): Promise<void> {
    await expect(this.board.getByRole('heading', { level: 2 })).toHaveText(names)
  }

  async verifyEmptyState(text: string): Promise<void> {
    await expect(this.emptyState).toContainText(text)
  }

  async verifyNoEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeHidden()
  }

  /** The card is in that column, wherever a drop put it */
  async verifyCardsInclude(stage: StageId, title: string): Promise<void> {
    await expect(this.card(title, this.column(stage))).toHaveCount(1)
  }

  async verifyCards(stage: StageId, titles: string[]): Promise<void> {
    await expect(this.cardsIn(stage).getByRole('heading', { level: 3 })).toHaveText(titles)
  }

  async verifyColumnCount(stage: StageId, count: number): Promise<void> {
    // The badge's accessible name is the localised count, e.g. "2 applications"
    await expect(this.column(stage).getByLabel(new RegExp(`^${count} `))).toHaveText(String(count))
  }

  async verifyCardShows(title: string, texts: string[]): Promise<void> {
    for (const text of texts) await expect(this.card(title)).toContainText(text)
  }

  /** Spec 014 FR-030: the line with the work format and the salary; null = no line */
  async verifyCardFieldsLine(title: string, line: RegExp | null): Promise<void> {
    const shown = this.card(title).getByTestId('card-fields')
    if (line === null) await expect(shown).toHaveCount(0)
    else await expect(shown).toHaveText(line)
  }

  /** Spec 007 FR-005, FR-010: the tint, and the colour name for assistive technology */
  async verifyCardColor(title: string, color: CardColor | null, name?: string): Promise<void> {
    if (color === null) {
      await expect(this.cardBox(title)).not.toHaveAttribute('data-color')
      await expect(this.card(title)).not.toHaveAccessibleName(/(Colour|Колір):/)
      return
    }
    await expect(this.cardBox(title)).toHaveAttribute('data-color', color)
    if (name) await expect(this.card(title)).toHaveAccessibleName(new RegExp(` ${name} `))
  }

  /** Spec 007 FR-002: the "Colour" item shows the current colour; its panel marks it */
  async verifyColorMenu(title: string, current: string, options: string[]): Promise<void> {
    await this.openCardMenu(title)
    await expect(this.colorItem()).toContainText(current)
    await this.colorItem().click()
    await expect(this.menu.getByRole('menuitemradio')).toHaveText(options)
    await expect(this.menu.getByRole('menuitemradio', { checked: true })).toHaveText(current)
    await this.colorOption(current).press('Escape') // back to the main panel
    await this.colorItem().press('Escape') // close
    await expect(this.menu).toBeHidden()
  }

  async verifyCardFocused(stage: StageId, title: string): Promise<void> {
    await expect(this.card(title, this.column(stage))).toBeFocused()
  }

  async verifyCardMenuFocused(title: string): Promise<void> {
    await expect(this.cardActions(title)).toBeFocused()
  }

  /** The card menu: the "Move to" stages, then "Colour" (spec 007) */
  async verifyMenuItems(stages: string[]): Promise<void> {
    await expect(this.menu.getByRole('menuitem')).toHaveText([
      ...stages,
      /^(Next step…|Наступний крок…)$/,
      /^(Colour|Колір)/,
    ])
  }

  async verifyMenuItemFocused(name: string): Promise<void> {
    await expect(this.menu.getByRole('menuitem', { name })).toBeFocused()
  }

  async verifyMenuClosed(): Promise<void> {
    await expect(this.menu).toBeHidden()
  }

  /** US-9: the colours of the whole window */
  async verifyTheme(theme: 'light' | 'dark'): Promise<void> {
    await expect(this.appRoot).toHaveCSS('background-color', BACKGROUND[theme])
  }

  async verifyLanguage(name: 'English' | 'Українська', addButtonText: string): Promise<void> {
    await this.settings.open(/^(General|Загальні)$/)
    await this.settings.verifyLanguage(name)
    await this.settings.close()
    await expect(this.addButton).toHaveText(addButtonText)
  }

  async verifyStorageError(texts: string[]): Promise<void> {
    await expect(this.storageError).toBeVisible()
    for (const text of texts) await expect(this.storageError).toContainText(text)
    await expect(this.addButton).toBeDisabled()
  }
}
