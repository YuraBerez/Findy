import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Same aliases as the renderer, for unit tests of its pure modules (tests/unit/renderer)
  resolve: {
    alias: { '@domain': resolve('src/domain'), '@shared': resolve('src/shared') },
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      // Unit-testable code. Electron bootstrap, preload and React UI are covered by e2e.
      include: ['src/domain/**', 'src/main/**', 'src/shared/**'],
      // Electron glue, covered by e2e: app bootstrap (index.ts, app/) and installing the native menu
      exclude: [
        'src/main/index.ts',
        'src/main/app/**',
        'src/main/mcp/cli.ts',
        'src/main/connector/cli.ts',
        'src/main/menu.ts',
        '**/*.d.ts',
      ],
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
