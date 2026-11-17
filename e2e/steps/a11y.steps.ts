import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { BaseSteps } from 'playwright-e2e-kit'
import {
  formatViolations,
  WCAG_A_AA_TAGS,
  withoutExclusions,
  type A11yExclusion,
} from 'playwright-e2e-kit/a11y'

/**
 * The kit's A11ySteps for Electron. axe's default mode opens a blank page to merge frame
 * results (`context.newPage()`), which Electron does not support, so this runs axe in
 * legacy mode. Everything else (tags, exclusions, report, message) is the kit's.
 */
export class ElectronA11ySteps extends BaseSteps {
  constructor(
    private readonly page: Page,
    private readonly exclusions: readonly A11yExclusion[] = [],
  ) {
    super('a11y')
  }

  async expectNoViolations(): Promise<void> {
    const { violations } = await new AxeBuilder({ page: this.page })
      .setLegacyMode(true)
      .withTags([...WCAG_A_AA_TAGS])
      .analyze()
    const remaining = withoutExclusions(violations, this.exclusions)
    if (remaining.length > 0) {
      await test.info().attach('axe-report.json', {
        body: JSON.stringify({ tags: WCAG_A_AA_TAGS, violations, remaining }, null, 2),
        contentType: 'application/json',
      })
    }
    expect(
      remaining.length,
      `${remaining.length} accessibility violation(s):\n${formatViolations(remaining)}`,
    ).toBe(0)
  }
}
