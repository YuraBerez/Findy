import type { APIRoute } from 'astro'
import { GUIDES } from '../lib/guides'
import { DEFAULT_LANG, LANGS, guidePage, pagePath, withBase } from '../lib/paths'

// Spec 020 FR-042: every page in both languages, with links to the other language
export const GET: APIRoute = ({ site }) => {
  const url = (lang: (typeof LANGS)[number], page: string) =>
    new URL(withBase(import.meta.env.BASE_URL, pagePath(lang, page)), site).href
  const pages = ['', ...GUIDES.map(guidePage)]
  const entries = pages.flatMap((page) =>
    LANGS.map((lang) => {
      const alternates = [
        ...LANGS.map((l) => [l, url(l, page)]),
        ['x-default', url(DEFAULT_LANG, page)],
      ]
        .map(([l, href]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${href}"/>`)
        .join('')
      return `<url><loc>${url(lang, page)}</loc>${alternates}</url>`
    }),
  )
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries.join('')}</urlset>\n`
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } })
}
