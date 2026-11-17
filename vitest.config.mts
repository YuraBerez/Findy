import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      // Unit-testable code. Electron bootstrap, preload and React UI are covered by e2e.
      include: ['src/domain/**', 'src/main/**', 'src/shared/**'],
      // Electron glue, covered by e2e: app bootstrap and installing the native menu
      exclude: ['src/main/index.ts', 'src/main/menu.ts', '**/*.d.ts'],
      reporter: ['text', 'json-summary', 'lcov'],
      // Quality gate (constitution §VI): CI fails below 80 %
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
})
