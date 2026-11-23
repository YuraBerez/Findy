import { fileURLToPath } from 'node:url'
import { defineConfig } from 'astro/config'
import { SITE_URL } from '../src/shared/project'
import { remarkGuideLinks } from './src/lib/remarkGuideLinks'

const site = new URL(SITE_URL)
/** The repository root: the website shows the guides, the screenshots and the logo from it */
const repo = fileURLToPath(new URL('..', import.meta.url))

// Spec 020: a static site on GitHub Pages under the repository path (case-sensitive)
export default defineConfig({
  site: site.origin,
  base: site.pathname,
  trailingSlash: 'always',
  output: 'static',
  build: { format: 'directory', inlineStylesheets: 'always' },
  // No syntax colours: Shiki writes inline styles that the CSP blocks
  markdown: {
    syntaxHighlight: false,
    remarkPlugins: [[remarkGuideLinks, { base: site.pathname }]],
  },
  // NFR-001: only the website's own files; Astro adds the hashes of inline scripts and styles
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'none'",
      ],
    },
  },
  vite: { server: { fs: { allow: [repo] } } },
})
