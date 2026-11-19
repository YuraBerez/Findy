import { describe, expect, it } from 'vitest'
import {
  customSiteUrl,
  declaredIcon,
  isKnownSiteId,
  KNOWN_SITES,
  knownSiteUrl,
  SITE_GROUPS,
  siteHost,
  siteUrlError,
  sniffImage,
  validateSiteForm,
  type KnownSite,
} from '../../src/domain/sites'

const site = (id: string): KnownSite => KNOWN_SITES.find((item) => item.id === id)!

describe('known sites (spec 011 FR-002)', () => {
  it('has the 14 sites in their groups and order', () => {
    const byGroup = Object.fromEntries(
      SITE_GROUPS.map((group) => [
        group,
        KNOWN_SITES.filter((item) => item.group === group).map((item) => item.name),
      ]),
    )
    expect(byGroup).toEqual({
      ukraine: ['Djinni', 'DOU', 'Work.ua', 'robota.ua'],
      international: ['LinkedIn Jobs', 'Indeed', 'Glassdoor'],
      remote: ['Wellfound', 'Remote OK', 'We Work Remotely'],
      europe: ['Jooble', 'EuroJobs', 'StepStone', 'XING'],
    })
  })

  it('every address is https, and every template has {query} once', () => {
    for (const item of KNOWN_SITES as readonly KnownSite[]) {
      expect(new URL(item.jobsUrl).protocol).toBe('https:')
      if (item.search) expect(siteUrlError(item.search.template)).toBeUndefined()
    }
    expect(new Set(KNOWN_SITES.map((item) => item.id)).size).toBe(KNOWN_SITES.length)
  })

  it('knows its ids', () => {
    expect(isKnownSiteId('djinni')).toBe(true)
    expect(isKnownSiteId('myspace')).toBe(false)
    expect(isKnownSiteId(1)).toBe(false)
  })
})

describe('knownSiteUrl (FR-006)', () => {
  it.each([
    ['djinni', 'https://djinni.co/jobs/?all_keywords=QA%20Engineer&search_type=full-text'],
    ['dou', 'https://jobs.dou.ua/vacancies/?search=QA%20Engineer'],
    ['workua', 'https://www.work.ua/jobs-QA+Engineer/'],
    ['robotaua', 'https://robota.ua/zapros/qa-engineer/ukraine'],
    ['linkedin', 'https://www.linkedin.com/jobs/search/?keywords=QA%20Engineer'],
    ['indeed', 'https://www.indeed.com/jobs?q=QA%20Engineer'],
    ['glassdoor', 'https://www.glassdoor.com/Job/jobs.htm?sc.keyword=QA%20Engineer'],
    ['weworkremotely', 'https://weworkremotely.com/remote-jobs/search?term=QA%20Engineer'],
    ['jooble', 'https://jooble.org/SearchResult?ukw=QA%20Engineer'],
    ['stepstone', 'https://www.stepstone.de/jobs/qa-engineer'],
    ['xing', 'https://www.xing.com/jobs/search?keywords=QA%20Engineer'],
  ])('%s searches for the query', (id, url) => {
    expect(knownSiteUrl(site(id), '  QA Engineer ')).toBe(url)
  })

  it('opens the jobs page for an empty query, and always for a site without search', () => {
    expect(knownSiteUrl(site('djinni'), '   ')).toBe('https://djinni.co/jobs/')
    expect(knownSiteUrl(site('wellfound'), 'QA')).toBe('https://wellfound.com/jobs')
    expect(knownSiteUrl(site('remoteok'), 'QA')).toBe('https://remoteok.com/')
    expect(knownSiteUrl(site('eurojobs'), 'QA')).toBe('https://www.eurojobs.com/')
  })

  it('encodes Ukrainian letters, &, # and / as one value (US-1.5)', () => {
    expect(knownSiteUrl(site('dou'), 'Тестувальник & QA #1/2')).toBe(
      'https://jobs.dou.ua/vacancies/?search=%D0%A2%D0%B5%D1%81%D1%82%D1%83%D0%B2%D0%B0%D0%BB%D1%8C%D0%BD%D0%B8%D0%BA%20%26%20QA%20%231%2F2',
    )
    expect(knownSiteUrl(site('workua'), 'C# & .NET')).toBe(
      'https://www.work.ua/jobs-C%23+%26+.NET/',
    )
    expect(knownSiteUrl(site('robotaua'), 'Тестувальник ПЗ')).toBe(
      'https://robota.ua/zapros/%D1%82%D0%B5%D1%81%D1%82%D1%83%D0%B2%D0%B0%D0%BB%D1%8C%D0%BD%D0%B8%D0%BA-%D0%BF%D0%B7/ukraine',
    )
  })

  it('a slug of only signs opens the jobs page', () => {
    expect(knownSiteUrl(site('stepstone'), '!!!')).toBe('https://www.stepstone.de/')
  })
})

describe('customSiteUrl (FR-006, US-2.1, US-2.2)', () => {
  const acme = { id: '1', name: 'Acme careers', url: 'https://acme.com/careers?q={query}' }

  it('puts the encoded query in place of {query}; empty without a query', () => {
    expect(customSiteUrl(acme, 'QA Engineer')).toBe('https://acme.com/careers?q=QA%20Engineer')
    expect(customSiteUrl(acme, ' ')).toBe('https://acme.com/careers?q=')
  })

  it('opens an address without {query} as is', () => {
    const plain = { id: '2', name: 'Board', url: 'https://jobs.example.com/' }
    expect(customSiteUrl(plain, 'QA')).toBe('https://jobs.example.com/')
  })
})

describe('siteHost (FR-004)', () => {
  it.each([
    ['https://www.work.ua/jobs/', 'work.ua'],
    ['https://jobs.dou.ua/vacancies/', 'jobs.dou.ua'],
    ['https://acme.com/careers?q={query}', 'acme.com'],
    ['not a url', ''],
  ])('%s → %s', (url, host) => expect(siteHost(url)).toBe(host))
})

describe('the user site form (FR-010, FR-013)', () => {
  it('accepts a name and an http(s) address with {query} once in the path, query or fragment', () => {
    for (const url of [
      'https://acme.com/careers?q={query}',
      'http://acme.com/jobs/{query}',
      'https://acme.com/#/search/{query}',
      'https://acme.com/careers',
    ])
      expect(siteUrlError(url), url).toBeUndefined()
    expect(validateSiteForm({ name: '  Acme  ', url: ' https://acme.com/ ' })).toEqual({
      ok: true,
      data: { name: 'Acme', url: 'https://acme.com/' },
    })
  })

  it.each([
    ['', { code: 'required' }],
    ['ftp://acme.com/', { code: 'invalidUrl' }],
    ['acme jobs', { code: 'invalidUrl' }],
    ['https://{query}.acme.com/', { code: 'queryPlacement' }],
    ['https://acme.com/{query}/{query}', { code: 'queryPlacement' }],
    [`https://acme.com/${'x'.repeat(2048)}`, { code: 'tooLong', max: 2048 }],
  ])('refuses the address %j', (url, error) => {
    expect(siteUrlError(url)).toEqual(error)
  })

  it('refuses an empty or a long name', () => {
    expect(validateSiteForm({ name: ' ', url: 'https://a.com' })).toEqual({
      ok: false,
      errors: { name: { code: 'required' } },
    })
    expect(validateSiteForm({ name: 'я'.repeat(61), url: '' })).toEqual({
      ok: false,
      errors: { name: { code: 'tooLong', max: 60 }, url: { code: 'required' } },
    })
  })
})

describe('icons (FR-022)', () => {
  const bytes = (...values: number[]) => new Uint8Array([...values, 0, 0, 0, 0, 0, 0, 0, 0])

  it.each([
    ['png', bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a), 'image/png'],
    ['ico', bytes(0x00, 0x00, 0x01, 0x00), 'image/x-icon'],
    ['jpeg', bytes(0xff, 0xd8, 0xff, 0xe0), 'image/jpeg'],
    ['gif', bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61), 'image/gif'],
    ['webp', bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50), 'image/webp'],
    ['svg', new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>'), null],
    ['html', new TextEncoder().encode('<!doctype html>'), null],
    ['empty', new Uint8Array(), null],
  ])('sniffs %s', (_case, data, mime) => {
    expect(sniffImage(data)).toBe(mime)
  })

  const PAGE = 'https://www.example.com/jobs/'

  it('finds the declared icon and resolves it', () => {
    expect(declaredIcon('<link rel="icon" href="/favicon.png">', PAGE)).toBe(
      'https://www.example.com/favicon.png',
    )
    expect(declaredIcon("<LINK REL='shortcut icon' HREF='img/i.ico'>", PAGE)).toBe(
      'https://www.example.com/jobs/img/i.ico',
    )
    expect(
      declaredIcon('<link href="https://cdn.example.net/t.png" rel="apple-touch-icon">', PAGE),
    ).toBe('https://cdn.example.net/t.png')
  })

  it('skips SVG, mask icons, other links and bad addresses', () => {
    const html = `
      <link rel="stylesheet" href="/a.css">
      <link rel="mask-icon" href="/mask.png">
      <link rel="icon" type="image/svg+xml" href="/i">
      <link rel="icon" href="/logo.svg?v=2">
      <link rel="icon" href="javascript:alert(1)">
      <link rel="icon" href="http://[bad">
      <link rel="icon">
      <link rel="icon" href="/ok.png">`
    expect(declaredIcon(html, PAGE)).toBe('https://www.example.com/ok.png')
    expect(declaredIcon('<link rel="stylesheet" href="/a.css">', PAGE)).toBeNull()
  })
})
