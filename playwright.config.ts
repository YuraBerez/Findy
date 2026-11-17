import { defineE2EConfig, quarantineGrepInvert } from 'playwright-e2e-kit/config'

// E2E suite on playwright-e2e-kit: e2e/{specs,steps,screens,fixtures,data}.
// Electron, not a browser: each test launches the built app (`out/`) with its own
// database (e2e/fixtures/app.ts), so there is no baseURL and no browser project.
//
// Flaky policy (docs/release.md → CI): no retry inside the run. On CI,
// scripts/e2e-ci.mjs runs the failed tests once more at the end of the run; a test
// that passes then is reported as flaky, a test that fails again fails the job.
export default defineE2EConfig({
  testDir: './e2e',
  grepInvert: quarantineGrepInvert(),
  retries: 0,
  failOnFlakyTests: false,
})
