import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'electron-vite'
import type { Plugin } from 'vite'

// React Fast Refresh injects an inline module script in dev, which the strict CSP
// in index.html blocks. Relax script-src for the dev server only; production
// builds keep the strict policy (docs/security.md).
function devCsp(): Plugin {
  return {
    name: 'findy:dev-csp',
    apply: 'serve',
    transformIndexHtml: (html) =>
      html.replace("script-src 'self'", "script-src 'self' 'unsafe-inline'"),
  }
}

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        // mcp.js runs in Node mode for AI assistants (spec 004, architecture D-8)
        input: { index: resolve('src/main/index.ts'), mcp: resolve('src/main/mcp/cli.ts') },
      },
    },
  },
  preload: {},
  renderer: {
    // Keep in sync with `paths` in tsconfig.web.json
    resolve: {
      alias: {
        '@domain': resolve('src/domain'),
        '@shared': resolve('src/shared'),
        '@ui': resolve('src/renderer/ui'),
      },
    },
    plugins: [react(), devCsp()],
  },
})
