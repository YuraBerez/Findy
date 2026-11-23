import { defineConfig, devices } from '@playwright/test'
import { SITE_URL } from '../src/shared/project'

const PORT = 4321
/** The built website, served under the same path as on GitHub Pages */
const BASE_URL = `http://localhost:${PORT}${new URL(SITE_URL).pathname}`

// Spec 020: browser checks of the built website (run `npm run build` first)
export default defineConfig({
  testDir: 'tests/browser',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: BASE_URL, ...devices['Desktop Chrome'] },
  webServer: {
    command: `npx astro preview --port ${PORT} --ignore-lock`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
  },
})
