import { defineE2EConfig, quarantineGrepInvert } from 'playwright-e2e-kit/config'

// E2E suite on playwright-e2e-kit: e2e/{specs,steps,screens,fixtures,data}.
// Electron, not a browser: each test launches the built app (`out/`) with its own
// database (e2e/fixtures/app.ts), so there is no baseURL and no browser project.
export default defineE2EConfig({
  testDir: './e2e',
  grepInvert: quarantineGrepInvert(),
})
