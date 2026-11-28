import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { parse, type HTMLElement } from 'node-html-parser'
import { describe, expect, it } from 'vitest'
import { PROJECT_URL, SITE_URL, SOURCE_URL, SUPPORT_URL } from '../../../src/shared/project'
import { MESSAGES } from '../../src/i18n'
import { GOOGLE_SITE_VERIFICATION } from '../../src/lib/site'
import { GUIDES } from '../../src/lib/guides'
import { LANGS, LANG_NAMES, guidePage, pagePath, type Lang } from '../../src/lib/paths'

// Spec 020: checks of the built website in dist/ (run `npm run build` first)
const DIST = new URL('../../dist/', import.meta.url).pathname
const BASE = new URL(SITE_URL).pathname
const RELEASE_FILES = `${PROJECT_URL}/releases/download/`

const PAGES = LANGS.flatMap((lang) =>
  ['', ...GUIDES.map(guidePage)].map((page) => ({ lang, page, path: pagePath(lang, page) })),
)

const read = (path: string): HTMLElement =>
  parse(readFileSync(join(DIST, path, 'index.html'), 'utf8'))

const attrs = (doc: HTMLElement, selector: string, name: string) =>
  doc.querySelectorAll(selector).map((el) => el.getAttribute(name) ?? '')

/** A link inside the website resolves to a file in dist/ */
function fileOf(href: string): string {
  const path = decodeURIComponent(href.slice(BASE.length).split('#')[0] ?? '')
  return join(DIST, path.endsWith('/') || path === '' ? `${path}index.html` : path)
}

describe.each(PAGES)('page /$path', ({ lang, page, path }) => {
  const doc = read(path)
  const url = (l: Lang) => `${SITE_URL}${pagePath(l, page)}`

  it('has the language, a title, a description and a canonical link (FR-040)', () => {
    expect(doc.querySelector('html')?.getAttribute('lang')).toBe(lang)
    expect(doc.querySelector('title')?.text.trim()).not.toBe('')
    expect(doc.querySelector('meta[name=description]')?.getAttribute('content')).toBeTruthy()
    expect(doc.querySelector('link[rel=canonical]')?.getAttribute('href')).toBe(url(lang))
  })

  it('links the same page in every language (FR-040)', () => {
    const alternates = Object.fromEntries(
      doc
        .querySelectorAll('link[rel=alternate]')
        .map((el) => [el.getAttribute('hreflang'), el.getAttribute('href')]),
    )
    expect(alternates).toEqual({
      ...Object.fromEntries(LANGS.map((l) => [l, url(l)])),
      'x-default': url('en'),
    })
  })

  it('has a preview for social networks (FR-041)', () => {
    for (const property of ['og:title', 'og:description', 'og:image', 'og:url']) {
      expect(
        doc.querySelector(`meta[property="${property}"]`)?.getAttribute('content'),
      ).toBeTruthy()
    }
    const image = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? ''
    expect(image.startsWith(SITE_URL)).toBe(true)
    expect(existsSync(fileOf(new URL(image).pathname))).toBe(true)
  })

  it('has a language menu that opens the same page in each language (FR-020)', () => {
    const menu = doc.querySelector('header details[data-language-menu]')
    expect(menu?.querySelector('summary')?.getAttribute('aria-label')).toContain(LANG_NAMES[lang])
    for (const l of LANGS) {
      const link = menu?.querySelector(`a[hreflang=${l}]`)
      expect(link?.getAttribute('href')).toBe(`${BASE}${pagePath(l, page)}`)
      expect(link?.getAttribute('aria-current') ?? null).toBe(l === lang ? 'page' : null)
    }
  })

  it('has a navigation to the home page and every guide (FR-022)', () => {
    const hrefs = attrs(doc, 'header a, footer a', 'href')
    expect(hrefs).toContain(`${BASE}${pagePath(lang)}`)
    for (const slug of GUIDES) expect(hrefs).toContain(`${BASE}${pagePath(lang, guidePage(slug))}`)
  })

  it('has the support, source, issues and licence links in the footer (FR-023)', () => {
    const hrefs = attrs(doc, 'footer a', 'href')
    expect(hrefs).toEqual(
      expect.arrayContaining([SUPPORT_URL, PROJECT_URL, `${SOURCE_URL}LICENSE`]),
    )
    expect(hrefs.some((href) => href.startsWith(`${PROJECT_URL}/issues`))).toBe(true)
  })

  it('has internal links that start with the base and open a file', () => {
    const hrefs = [...attrs(doc, 'a[href], link[href]', 'href'), ...attrs(doc, '[src]', 'src')]
    for (const href of hrefs.filter((h) => h.startsWith('/'))) {
      expect(href.startsWith(BASE), href).toBe(true)
      expect(existsSync(fileOf(href)), href).toBe(true)
    }
  })

  it('has every anchor link on a heading of the page', () => {
    const ids = new Set(attrs(doc, '[id]', 'id'))
    for (const href of attrs(doc, 'a[href^="#"]', 'href')) {
      expect(ids.has(decodeURIComponent(href.slice(1))), href).toBe(true)
    }
  })

  it('loads nothing from other sites (NFR-001)', () => {
    const external = (value: string) => /^(https?:)?\/\//.test(value)
    expect(attrs(doc, '[src]', 'src').filter(external)).toEqual([])
    expect(attrs(doc, '[srcset]', 'srcset').filter(external)).toEqual([])
    expect(attrs(doc, 'link[rel=stylesheet], link[rel=icon]', 'href').filter(external)).toEqual([])
    expect(
      doc.querySelector('meta[http-equiv=content-security-policy]')?.getAttribute('content'),
    ).toMatch(/default-src 'self'/)
  })
})

describe.each(LANGS)('home page (%s)', (lang) => {
  const doc = read(pagePath(lang))
  const t = MESSAGES[lang]

  it('shows the version and links only to release files (FR-010, FR-012)', () => {
    const download = doc.querySelector('#download')
    expect(download?.text).toMatch(/\d+\.\d+\.\d+/)
    const files = attrs(download!, 'a', 'href').filter((h) => h.includes('/releases/download/'))
    expect(files.length).toBeGreaterThanOrEqual(6)
    for (const href of files) expect(href.startsWith(RELEASE_FILES), href).toBe(true)
  })

  it('has a main button for each system and every build without scripts (FR-011, FR-015)', () => {
    for (const os of ['windows', 'mac', 'linux']) {
      expect(doc.querySelector(`.main[data-for=${os}] a`), os).not.toBeNull()
    }
    // the list of all builds is outside the main buttons, so it shows with no script
    const all = doc.querySelectorAll('#download .card a').map((a) => a.getAttribute('href'))
    for (const href of attrs(doc, '.main a', 'href')) expect(all).toContain(href)
  })

  it('shows the package managers, the extension and the release page (FR-014)', () => {
    const text = doc.querySelector('#download')?.text ?? ''
    expect(text).toMatch(/brew install --cask findy/)
    expect(text).toMatch(/scoop install findy/)
    const hrefs = attrs(doc, '#download a', 'href')
    expect(hrefs.some((h) => h.endsWith('-browser-extension.zip'))).toBe(true)
    expect(hrefs.some((h) => h.startsWith(`${PROJECT_URL}/releases/tag/`))).toBe(true)
  })

  it('links the first-start steps of the install guide (FR-005)', () => {
    const href = `${BASE}${pagePath(lang, guidePage('install'))}#${t.download.unsignedAnchor}`
    expect(attrs(doc, '#download a', 'href')).toContain(href)
  })

  it('shows the screenshots of the page language, later ones lazy (FR-003, NFR-005)', () => {
    const images = doc.querySelectorAll('main figure img')
    expect(images).toHaveLength(4)
    for (const img of images) expect(img.getAttribute('src')).toMatch(new RegExp(`-${lang}\\.`))
    expect(images.slice(1).every((img) => img.getAttribute('loading') === 'lazy')).toBe(true)
    expect(images.map((img) => img.getAttribute('alt'))).toEqual([
      t.screenshots.board,
      t.screenshots.details,
      t.screenshots.analytics,
      t.screenshots.sites,
    ])
  })

  it('tells what Findy does and that the data stays local (FR-002, FR-004)', () => {
    const text = doc.querySelector('main')?.text ?? ''
    for (const group of t.features.groups) {
      expect(text).toContain(group.title)
      for (const item of group.items) expect(text).toContain(item.title)
    }
    expect(text).toContain(t.privacy.title)
    expect(text).toContain(t.hero.facts)
    expect(attrs(doc, '.hero a', 'href')).toEqual(
      expect.arrayContaining(['#download', PROJECT_URL]),
    )
  })
})

describe('guides (FR-006 – FR-008)', () => {
  const source = new URL('../../../docs/guide/', import.meta.url).pathname

  it.each(PAGES.filter((p) => p.page !== ''))(
    '/$path has the text of its file',
    ({ lang, page }) => {
      const slug = page.split('/')[1] ?? ''
      const file = lang === 'en' ? `${slug}.md` : `${slug}.${lang}.md`
      const markdown = readFileSync(join(source, file), 'utf8')
      const heading = markdown.match(/^# (.+)$/m)?.[1] ?? ''
      const doc = read(pagePath(lang, page))
      expect(doc.querySelector('article h1')?.text).toBe(heading)
      // no link in a guide points to a Markdown file that the website does not have
      for (const href of attrs(doc, 'article a', 'href')) {
        expect(href.startsWith(SOURCE_URL) || !href.endsWith('.md'), href).toBe(true)
      }
    },
  )

  it('has one page per guide file', () => {
    const files = readdirSync(source).filter((f) => f.endsWith('.md'))
    expect(files).toHaveLength(PAGES.filter((p) => p.page !== '').length)
  })
})

describe('search engines (FR-040)', () => {
  it('proves the site owner to Google Search Console', () => {
    const doc = read(pagePath('en'))
    const tag = doc.querySelector('meta[name="google-site-verification"]')
    expect(tag?.getAttribute('content')).toBe(GOOGLE_SITE_VERIFICATION)
  })

  it('gives every page its own description', () => {
    const descriptions = PAGES.map(({ path }) =>
      read(path).querySelector('meta[name=description]')?.getAttribute('content'),
    )
    expect(new Set(descriptions).size).toBe(PAGES.length)
  })

  it.each(LANGS)('describes the app with schema.org data on the home page (%s)', (lang) => {
    const json = read(pagePath(lang)).querySelector('script[type="application/ld+json"]')?.text
    const data = JSON.parse(json ?? '{}')
    expect(data).toMatchObject({
      '@type': 'SoftwareApplication',
      name: 'Findy',
      inLanguage: lang,
      url: `${SITE_URL}${pagePath(lang)}`,
      offers: { price: '0' },
    })
    expect(data.softwareVersion).toMatch(/^\d+\.\d+\.\d+/)
  })

  it('has a 404 page in both languages that is not indexed', () => {
    const doc = parse(readFileSync(join(DIST, '404.html'), 'utf8'))
    expect(doc.querySelector('meta[name=robots]')?.getAttribute('content')).toBe('noindex')
    expect(doc.querySelector('link[rel=canonical]')).toBeNull()
    const hrefs = attrs(doc, 'main a', 'href')
    for (const lang of LANGS) expect(hrefs).toContain(`${BASE}${pagePath(lang)}`)
  })
})

describe('sitemap and robots.txt (FR-042)', () => {
  it('lists every page with its other language', () => {
    const xml = readFileSync(join(DIST, 'sitemap.xml'), 'utf8')
    for (const { path } of PAGES) expect(xml).toContain(`<loc>${SITE_URL}${path}</loc>`)
    expect(xml.match(/hreflang="x-default"/g)).toHaveLength(PAGES.length)
  })

  it('points robots to the sitemap', () => {
    const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8')
    expect(robots).toContain(`Sitemap: ${SITE_URL}sitemap.xml`)
  })

  it('has no file outside the base', () => {
    expect(relative(DIST, fileOf(BASE))).toBe('index.html')
  })
})
