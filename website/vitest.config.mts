import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      // The pure logic, with the same 80 % gate as the app (constitution §VI.4)
      { test: { name: 'unit', include: ['tests/unit/**/*.test.ts'], environment: 'node' } },
      // The built pages in dist/: run after `npm run build`
      { test: { name: 'built', include: ['tests/built/**/*.test.ts'], environment: 'node' } },
    ],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/i18n/**'],
      reporter: ['text', 'json-summary'],
      thresholds: { lines: 80, branches: 80, functions: 80, statements: 80 },
    },
  },
})
