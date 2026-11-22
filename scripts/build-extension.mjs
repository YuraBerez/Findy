// Spec 019 FR-012: builds the browser extension (src/extension) for Chromium and Firefox
// into out/extension/<target>. The popup is one Vite build; the manifests differ only in
// the browser keys. The store texts come from locales/*.json (NFR-006), so the extension
// has no second copy of them.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { build } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'src/extension')
const dist = join(root, 'out/extension')
const { chromium, firefox, ...base } = JSON.parse(
  readFileSync(join(source, 'manifest.json'), 'utf8'),
)

// The ids live in src/shared/extension.ts; read them as text, so this script needs no TS loader
const shared = readFileSync(join(root, 'src/shared/extension.ts'), 'utf8')
const FIREFOX_EXTENSION_ID = /FIREFOX_EXTENSION_ID = '([^']+)'/.exec(shared)[1]

/** Chrome Web Store limits */
const LIMITS = { storeName: 75, storeDescription: 132, title: 75 }

function writeLocales(target) {
  for (const language of ['en', 'uk']) {
    const { extension } = JSON.parse(
      readFileSync(join(root, 'locales', `${language}.json`), 'utf8'),
    )
    const messages = {}
    for (const [key, max] of Object.entries(LIMITS)) {
      if (extension[key].length > max)
        throw new Error(`${language}: extension.${key} is longer than ${max}`)
      messages[key] = { message: extension[key] }
    }
    const folder = join(target, '_locales', language)
    mkdirSync(folder, { recursive: true })
    writeFileSync(join(folder, 'messages.json'), `${JSON.stringify(messages, null, 2)}\n`)
  }
}

// The extension ships with the app release (spec D-8), so it has the version of the app
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

const manifests = {
  chromium: { ...base, version, ...chromium },
  firefox: {
    ...base,
    version,
    browser_specific_settings: {
      gecko: { ...firefox.browser_specific_settings.gecko, id: FIREFOX_EXTENSION_ID },
    },
  },
}

rmSync(dist, { recursive: true, force: true })
const popup = join(dist, 'build')
await build({
  configFile: false,
  // The root is src/extension, so the popup keeps its path: popup/index.html
  root: source,
  base: './',
  logLevel: 'warn',
  plugins: [react()],
  resolve: {
    // Keep in sync with `paths` in tsconfig.extension.json
    alias: {
      '@domain': join(root, 'src/domain'),
      '@shared': join(root, 'src/shared'),
      '@ui': join(root, 'src/renderer/ui'),
      '@styles': join(root, 'src/renderer/styles'),
    },
  },
  build: {
    outDir: popup,
    emptyOutDir: true,
    // No modulepreload polyfill: it is the only fetch in the bundle (NFR-001)
    modulePreload: { polyfill: false },
    rollupOptions: { input: join(source, 'popup/index.html') },
  },
})

for (const [target, manifest] of Object.entries(manifests)) {
  const out = join(dist, target)
  cpSync(popup, out, { recursive: true })
  cpSync(join(source, 'icons'), join(out, 'icons'), { recursive: true })
  writeLocales(out)
  writeFileSync(join(out, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
}
rmSync(popup, { recursive: true, force: true })
console.log(
  `Extension built: ${Object.keys(manifests)
    .map((target) => `out/extension/${target}`)
    .join(', ')}`,
)
