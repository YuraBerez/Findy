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
  markdown: { remarkPlugins: [[remarkGuideLinks, { base: site.pathname }]] },
  vite: { server: { fs: { allow: [repo] } } },
})
