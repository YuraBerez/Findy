import { expect, type Locator, type Page } from '@playwright/test'
import { BaseComponent } from 'playwright-e2e-kit'

export interface Totals {
  applications: number
  interviews: number
  offers: number
  rejections: number
}

/** Spec 005: the tabs in the toolbar and the analytics screen. */
export class AnalyticsScreen extends BaseComponent {
  private readonly toolbar: Locator
  private readonly tabs: Locator
  private readonly panel: Locator
  private readonly boardPanel: Locator
  private readonly period: Locator
  private readonly grouping: Locator
  private readonly totals: Locator
  private readonly noActivity: Locator
  private readonly empty: Locator
  private readonly funnel: Locator

  constructor(page: Page) {
    super(page)
    this.toolbar = page.getByRole('banner')
    this.tabs = this.toolbar.getByRole('tablist')
    this.panel = page.getByRole('tabpanel', { name: /^(Analytics|Аналітика)$/ })
    this.boardPanel = page.getByRole('tabpanel', { name: /^(Board|Дошка)$/ })
    this.period = this.panel.getByLabel(/^(Period|Період)$/)
    this.grouping = this.panel.getByLabel(/^(Group by|Групувати)$/)
    this.totals = this.panel.getByRole('definition')
    this.noActivity = this.panel.getByRole('status')
    this.empty = page.getByTestId('empty-analytics')
    this.funnel = this.card(/^(Funnel|Воронка)$/)
  }

  private tab(name: string): Locator {
    return this.tabs.getByRole('tab', { name })
  }

  private card(title: string | RegExp): Locator {
    return this.panel.getByRole('region', { name: title })
  }

  private chart(title: string): Locator {
    return this.card(title).getByRole('group', { name: title })
  }

  // ── Tabs (US-1) ────────────────────────────────────────────────────────

  async openTab(name: string): Promise<void> {
    await this.tab(name).click()
  }

  async pressOnTab(name: string, key: string): Promise<void> {
    await this.tab(name).press(key)
  }

  /** FR-002: Ctrl+1 / Ctrl+2, Cmd on macOS; pressed on the selected tab */
  async pressShortcut(digit: 1 | 2): Promise<void> {
    await this.tabs.getByRole('tab', { selected: true }).press(`ControlOrMeta+${digit}`)
  }

  async verifySelectedTab(name: string, focused = false): Promise<void> {
    await expect(this.tab(name)).toHaveAttribute('aria-selected', 'true')
    if (focused) await expect(this.tab(name)).toBeFocused()
  }

  async verifyShown(): Promise<void> {
    await expect(this.panel).toBeVisible()
    await expect(this.boardPanel).toBeHidden()
  }

  async verifyBoardShown(): Promise<void> {
    await expect(this.boardPanel).toBeVisible()
    await expect(this.panel).toBeHidden()
  }

  /** FR-004: no search and no "Add application" on the analytics tab */
  async verifyBoardActionsHidden(): Promise<void> {
    await expect(this.toolbar.getByRole('searchbox')).toHaveCount(0)
    await expect(
      this.toolbar.getByRole('button', { name: /^(Add application|Додати заявку)$/ }),
    ).toHaveCount(0)
  }

  // ── Filters (US-6) ─────────────────────────────────────────────────────

  async selectPeriod(label: string): Promise<void> {
    await this.period.selectOption({ label })
  }

  async selectGrouping(label: string): Promise<void> {
    await this.grouping.selectOption({ label })
  }

  /** Values, e.g. '30d' and 'day' */
  async verifyFilters(period: string, grouping: string): Promise<void> {
    await expect(this.period).toHaveValue(period)
    await expect(this.grouping).toHaveValue(grouping)
  }

  // ── Numbers ────────────────────────────────────────────────────────────

  /** US-5: applications, interviews, offers, rejections */
  async verifyTotals(totals: Totals): Promise<void> {
    await expect(this.totals).toHaveText(
      [totals.applications, totals.interviews, totals.offers, totals.rejections].map((n) =>
        n.toLocaleString('en-US'),
      ),
    )
  }

  /** FR-026: the numbers behind a chart, row by row */
  async verifyTable(chart: string, rows: (string | RegExp)[][]): Promise<void> {
    const card = this.card(chart)
    await card.getByRole('button', { name: /^(Show as table|Показати таблицею)$/ }).click()
    // The first row holds the column headers
    const body = card.getByRole('table').getByRole('row')
    await expect(body).toHaveCount(rows.length + 1)
    for (const [i, row] of rows.entries()) {
      const line = body.nth(i + 1)
      await expect(line.getByRole('rowheader').or(line.getByRole('cell'))).toHaveText(row)
    }
    await card.getByRole('button', { name: /^(Show as chart|Показати графіком)$/ }).click()
  }

  /** FR-025: focus the chart and move the cursor with keys; the caption says the value */
  async readBarWithKeyboard(
    chart: string,
    keys: string[],
    caption: string | RegExp,
  ): Promise<void> {
    const plot = this.chart(chart)
    await plot.focus()
    for (const key of keys) await plot.press(key)
    await expect(plot).toHaveAccessibleDescription(caption)
  }

  async verifyLegend(chart: string, shown: string[], hidden: string[] = []): Promise<void> {
    const legend = this.card(chart).getByRole('list', { name: /^(Stages shown|Показані етапи)$/ })
    for (const name of shown)
      await expect(legend.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'true')
    for (const name of hidden)
      await expect(legend.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'false')
  }

  async toggleLegend(chart: string, name: string): Promise<void> {
    await this.card(chart).getByRole('button', { name, exact: true }).click()
  }

  /** US-4: [stage, count, share] per step */
  async verifyFunnel(steps: [string, number, string][], rejected: number): Promise<void> {
    const items = this.funnel.getByRole('listitem')
    await expect(items).toHaveCount(steps.length)
    for (const [i, [stage, count, share]] of steps.entries()) {
      // ICU puts a no-break space before "%"
      const text = (await items.nth(i).innerText()).replace(/\s+/g, ' ').trim()
      expect(text).toBe(`${stage} ${count} (${share})`)
    }
    await expect(this.funnel.getByText(/^(Rejected|Відмови): /)).toHaveText(
      new RegExp(`: ${rejected}$`),
    )
  }

  async verifyFunnelStepCount(count: number): Promise<void> {
    await expect(this.funnel.getByRole('listitem')).toHaveCount(count)
  }

  /** NFR-005: the screen scrolls only vertically; every chart is as wide as the window allows */
  async verifyFitsWindow(): Promise<void> {
    const overflow = await this.panel.evaluate(
      (element) => element.scrollWidth - element.clientWidth,
    )
    expect(overflow).toBe(0)
    for (const name of ['Applications sent', 'Stages over time', 'Funnel']) {
      await this.card(name).scrollIntoViewIfNeeded()
      await expect(this.card(name)).toBeInViewport()
    }
  }

  // ── Empty states (US-7) ────────────────────────────────────────────────

  async verifyEmpty(): Promise<void> {
    await expect(this.empty).toBeVisible()
  }

  async openBoardFromEmptyState(): Promise<void> {
    await this.empty.getByRole('button').click()
  }

  async verifyNoActivity(shown: boolean): Promise<void> {
    if (shown)
      await expect(this.noActivity).toHaveText(
        /^(No activity in this period|За цей період активності немає)$/,
      )
    else await expect(this.noActivity).toHaveCount(0)
  }
}
