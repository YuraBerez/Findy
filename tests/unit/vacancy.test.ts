import { describe, expect, it } from 'vitest'
import { charsetOf, decodePage, extractVacancy } from '../../src/domain/vacancy'

const ldJson = (data: unknown, type = 'application/ld+json') =>
  `<script type="${type}">${JSON.stringify(data)}</script>`

const page = (head: string, body = '') =>
  `<!doctype html><html><head>${head}</head><body>${body}</body></html>`

describe('extractVacancy (spec 009 FR-004)', () => {
  it('reads a JobPosting: title and the hiring organisation name', () => {
    const html = page(
      ldJson({
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: 'Frontend Developer',
        hiringOrganization: { '@type': 'Organization', name: 'Acme' },
      }),
    )
    expect(extractVacancy(html)).toEqual({ title: 'Frontend Developer', company: 'Acme' })
  })

  it('prefers the JobPosting over link preview data and the page title', () => {
    const html = page(
      `<title>Jobs | Board</title><meta property="og:title" content="Preview title">
       <meta property="og:site_name" content="Board">` +
        ldJson({ '@type': 'JobPosting', title: 'QA Engineer', hiringOrganization: 'Globex' }),
    )
    expect(extractVacancy(html)).toEqual({ title: 'QA Engineer', company: 'Globex' })
  })

  it.each([
    [
      'in an array',
      [
        { '@type': 'WebSite', name: 'x' },
        { '@type': 'JobPosting', title: 'A', hiringOrganization: { name: 'B' } },
      ],
    ],
    [
      'in @graph',
      {
        '@graph': [
          { '@type': 'Organization' },
          { '@type': ['JobPosting'], title: 'A', hiringOrganization: [{ name: 'B' }] },
        ],
      },
    ],
    ['with name instead of title', { '@type': 'JobPosting', name: 'A', hiringOrganization: 'B' }],
  ])('finds the JobPosting %s', (_case, data) => {
    expect(extractVacancy(page(ldJson(data)))).toEqual({ title: 'A', company: 'B' })
  })

  it('uses the first JobPosting; skips broken JSON-LD blocks', () => {
    const html = page(
      '<script type="application/ld+json">{ broken </script>' +
        ldJson({ '@type': 'JobPosting', title: 'First', hiringOrganization: 'One' }) +
        ldJson({ '@type': 'JobPosting', title: 'Second', hiringOrganization: 'Two' }),
    )
    expect(extractVacancy(html)).toEqual({ title: 'First', company: 'One' })
  })

  it('falls back field by field: no organisation in the JobPosting → og:site_name', () => {
    const html = page(
      '<meta property="og:site_name" content="Initech">' +
        ldJson({ '@type': 'JobPosting', title: 'Designer' }),
    )
    expect(extractVacancy(html)).toEqual({ title: 'Designer', company: 'Initech' })
  })

  it('reads Open Graph with any attribute order and quotes, as is (no site clean-up)', () => {
    const html = page(
      `<meta content='Senior QA — Acme | Jobs' property='og:title'>
       <META NAME=og:site_name CONTENT="Djinni">`,
    )
    expect(extractVacancy(html)).toEqual({ title: 'Senior QA — Acme | Jobs', company: 'Djinni' })
  })

  it('falls back to the page title, with no company', () => {
    expect(extractVacancy(page('<title>\n  Backend Developer\n</title>'))).toEqual({
      title: 'Backend Developer',
      company: null,
    })
  })

  it('returns nulls for a page without vacancy data', () => {
    expect(extractVacancy(page('', '<h1>Sign in</h1>'))).toEqual({ title: null, company: null })
    expect(extractVacancy('')).toEqual({ title: null, company: null })
    expect(extractVacancy(page(ldJson([{ '@type': 'WebSite' }, 'text', null])))).toEqual({
      title: null,
      company: null,
    })
  })

  it('decodes entities, removes tags and collapses whitespace', () => {
    const html = page(
      `<meta property="og:title" content="R&amp;D &#8212; &laquo;Lead&raquo;&nbsp;&#x41;&unknown;">` +
        ldJson({ '@type': 'JobPosting', hiringOrganization: '  Acme <b>Ltd</b>\n\t Co ' }),
    )
    expect(extractVacancy(html)).toEqual({
      title: 'R&D — «Lead» A&unknown;',
      company: 'Acme Ltd Co',
    })
  })

  it('keeps Ukrainian text and emoji; cuts to 200 characters without splitting one', () => {
    const long = '🚀' + 'я'.repeat(250)
    const html = page(
      ldJson({ '@type': 'JobPosting', title: long, hiringOrganization: 'Компанія' }),
    )
    const { title, company } = extractVacancy(html)
    expect(Array.from(title!)).toHaveLength(200)
    expect(title!.startsWith('🚀я')).toBe(true)
    expect(company).toBe('Компанія')
  })

  it('treats empty and non-text values as missing', () => {
    const html = page(
      '<meta property="og:title" content="  "><title>Fallback</title>' +
        ldJson({ '@type': 'JobPosting', title: 42, hiringOrganization: { name: '' } }),
    )
    expect(extractVacancy(html)).toEqual({ title: 'Fallback', company: null })
  })

  it('ignores scripts of other types', () => {
    const html = page(
      ldJson(
        { '@type': 'JobPosting', title: 'Hidden', hiringOrganization: 'X' },
        'text/javascript',
      ),
    )
    expect(extractVacancy(html)).toEqual({ title: null, company: null })
  })
})

describe('charset (spec 009 edge cases)', () => {
  const bytes = (text: string) => new TextEncoder().encode(text)

  it('takes the charset from Content-Type first', () => {
    expect(charsetOf('text/html; charset="Windows-1251"', bytes('<meta charset="utf-8">'))).toBe(
      'windows-1251',
    )
  })

  it.each([
    ['<meta charset="koi8-u">', 'koi8-u'],
    ["<meta charset='ISO-8859-5'>", 'iso-8859-5'],
    ['<meta http-equiv="Content-Type" content="text/html; charset=windows-1251">', 'windows-1251'],
    ['<p>nothing</p>', 'utf-8'],
  ])('reads %s', (head, charset) => {
    expect(charsetOf('text/html', bytes(head))).toBe(charset)
  })

  it('decodes a windows-1251 page that names its charset', () => {
    // «Розробник» in windows-1251
    const word = [0xd0, 0xee, 0xe7, 0xf0, 0xee, 0xe1, 0xed, 0xe8, 0xea]
    const html = new Uint8Array([
      ...bytes('<meta charset="windows-1251"><title>'),
      ...word,
      ...bytes('</title>'),
    ])
    expect(extractVacancy(decodePage(html, 'text/html')).title).toBe('Розробник')
  })

  it('reads an unknown label and a UTF-8 BOM as UTF-8', () => {
    expect(decodePage(bytes('<meta charset="no-such">Привіт'), null)).toContain('Привіт')
    expect(decodePage(new Uint8Array([0xef, 0xbb, 0xbf, ...bytes('Так')]), null)).toBe('Так')
  })
})
