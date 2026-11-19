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

  it('reads Open Graph with any attribute order and quotes', () => {
    const html = page(
      `<meta content='Senior QA' property='og:title'>
       <META NAME=og:site_name CONTENT="Acme">`,
    )
    expect(extractVacancy(html)).toEqual({ title: 'Senior QA', company: 'Acme' })
  })

  it('falls back to the page title, with no company', () => {
    expect(extractVacancy(page('<title>\n  Backend Developer\n</title>'))).toEqual({
      title: 'Backend Developer',
      company: null,
    })
  })

  it('returns nulls for a page without vacancy data', () => {
    expect(extractVacancy(page('', '<p>Nothing here</p>'))).toEqual({ title: null, company: null })
    expect(extractVacancy('')).toEqual({ title: null, company: null })
    expect(extractVacancy(page(ldJson([{ '@type': 'WebSite' }, 'text', null])))).toEqual({
      title: null,
      company: null,
    })
  })

  it('decodes entities, removes tags and collapses whitespace', () => {
    const html = page(
      ldJson({
        '@type': 'JobPosting',
        title: 'R&amp;D &#8212; &laquo;Lead&raquo;&nbsp;&#x41;&unknown;',
        hiringOrganization: '  Acme <b>Ltd</b>\n\t Co ',
      }),
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

describe('extractVacancy: page title split (FR-004 step 2)', () => {
  it.each([
    ['Senior QA — Acme | Jobs', 'Jobs', undefined, 'Senior QA', 'Acme'],
    [
      'Python Developer - Globex - Djinni',
      null,
      'https://djinni.co/jobs/1',
      'Python Developer',
      'Globex',
    ],
    ['Work.ua · Designer · Initech', null, 'https://www.work.ua/jobs/1/', 'Designer', 'Initech'],
    [
      'Backend Engineer at Umbrella | LinkedIn',
      'LinkedIn',
      undefined,
      'Backend Engineer',
      'Umbrella',
    ],
    ['Senior QA at a fintech startup!', null, undefined, 'Senior QA', 'a fintech startup!'],
    ['Front-end developer', null, undefined, 'Front-end developer', null],
    ['Розробник :: Компанія «Світло»', null, undefined, 'Розробник', 'Компанія «Світло»'],
  ])('%s → %s / %s', (title, site, url, jobTitle, company) => {
    const head =
      `<meta property="og:title" content="${title}">` +
      (site ? `<meta property="og:site_name" content="${site}">` : '')
    expect(extractVacancy(page(head), url)).toEqual({ title: jobTitle, company: company ?? site })
  })

  it('uses the page title when there is no link preview title', () => {
    expect(extractVacancy(page('<title>QA Lead | Acme</title>'))).toEqual({
      title: 'QA Lead',
      company: 'Acme',
    })
  })

  it('gives nothing when the title is only the site name', () => {
    expect(extractVacancy(page('<title>Djinni</title>'), 'https://djinni.co/x')).toEqual({
      title: null,
      company: null,
    })
  })
})

describe('extractVacancy: microdata (FR-004 step 1)', () => {
  it('reads the title and the organisation name of an itemscope JobPosting', () => {
    const html = page(
      '<title>Jobs</title>',
      `<div itemscope itemtype="https://schema.org/JobPosting">
         <h1 itemprop="title">Data Engineer</h1>
         <div itemprop="hiringOrganization" itemscope itemtype="https://schema.org/Organization">
           <span itemprop="name">Hooli</span>
         </div>
       </div>`,
    )
    expect(extractVacancy(html)).toEqual({ title: 'Data Engineer', company: 'Hooli' })
  })

  it('takes a content attribute and an organisation without a name element', () => {
    const html = page(
      '',
      `<div itemscope itemtype="http://schema.org/JobPosting">
         <meta itemprop="title" content="SRE">
         <span itemprop="hiringOrganization">Pied Piper</span>
       </div>`,
    )
    expect(extractVacancy(html)).toEqual({ title: 'SRE', company: 'Pied Piper' })
  })

  it('fills only what JSON-LD lacks', () => {
    const html = page(
      `<script type="application/ld+json">{"@type":"JobPosting","title":"From JSON-LD"}</script>`,
      `<div itemscope itemtype="https://schema.org/JobPosting">
         <h1 itemprop="title">From microdata</h1>
         <span itemprop="hiringOrganization">Vandelay</span></div>`,
    )
    expect(extractVacancy(html)).toEqual({ title: 'From JSON-LD', company: 'Vandelay' })
  })

  it('ignores itemprop values outside a JobPosting page', () => {
    expect(extractVacancy(page('', '<span itemprop="title">Not a job</span>'))).toEqual({
      title: null,
      company: null,
    })
  })
})

describe('extractVacancy: visible page (FR-004 step 3)', () => {
  it('takes the main heading and the element marked as the company', () => {
    const html = page(
      '<title>Vacancy</title>',
      `<header class="site">Board</header>
       <h1 class="vacancy-title"> Mobile <em>Developer</em> </h1>
       <a class="job-company-name" href="/c/1">Stark Industries</a>`,
    )
    expect(extractVacancy(html)).toEqual({ title: 'Vacancy', company: 'Stark Industries' })
    expect(extractVacancy(html.replace('<title>Vacancy</title>', ''))).toEqual({
      title: 'Mobile Developer',
      company: 'Stark Industries',
    })
  })

  it.each([
    ['id', '<b id="employer">Wayne Enterprises</b>'],
    ['data-qa', '<span data-qa="vacancy-company">Wayne Enterprises</span>'],
    ['Ukrainian class', '<div class="компанія">Wayne Enterprises</div>'],
    ['data-testid', '<p data-testid="roboтодавець роботодавець">Wayne Enterprises</p>'],
  ])('finds the company by %s', (_case, element) => {
    expect(extractVacancy(page('', `<h1>Ops</h1>${element}`)).company).toBe('Wayne Enterprises')
  })

  it('skips long company texts, empty ones and hidden template content', () => {
    const html = page(
      '',
      `<h1>Ops</h1>
       <script>var company = '<span class="company">Script Inc</span>'</script>
       <template><span class="company">Template Inc</span></template>
       <!-- <span class="company">Comment Inc</span> -->
       <section class="about-company">${'Long text about the company. '.repeat(10)}</section>
       <span class="company-logo"><img src="x.png"></span>
       <span class="company">Real Inc</span>`,
    )
    expect(extractVacancy(html).company).toBe('Real Inc')
  })

  it('uses the site name as the company only when nothing else gives one (step 4)', () => {
    const head = '<meta property="og:site_name" content="Djinni"><title>QA</title>'
    expect(extractVacancy(page(head))).toEqual({ title: 'QA', company: 'Djinni' })
    expect(extractVacancy(page(head, '<span class="company">Acme</span>'))).toEqual({
      title: 'QA',
      company: 'Acme',
    })
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
