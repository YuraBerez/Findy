import { describe, expect, it } from 'vitest'
import { sameVacancyLink, vacancyLinkKey } from '../../src/domain/links'

describe('vacancy link key (spec 019 FR-007)', () => {
  it('ignores the host case, a slash at the end and the part after #', () => {
    expect(sameVacancyLink('https://Djinni.CO/jobs/123/', 'https://djinni.co/jobs/123#apply')).toBe(
      true,
    )
  })

  it('ignores tracking parameters', () => {
    expect(
      sameVacancyLink(
        'https://jobs.dou.ua/vacancies/1/?utm_source=tg&utm_medium=post&ref=feed',
        'https://jobs.dou.ua/vacancies/1/',
      ),
    ).toBe(true)
  })

  it('keeps other query parameters, in any order', () => {
    const a = 'https://www.linkedin.com/jobs/search/?currentJobId=1&keywords=qa&trk=x'
    expect(
      sameVacancyLink(a, 'https://www.linkedin.com/jobs/search?keywords=qa&currentJobId=1'),
    ).toBe(true)
    expect(
      sameVacancyLink(a, 'https://www.linkedin.com/jobs/search/?currentJobId=2&keywords=qa'),
    ).toBe(false)
  })

  it('keeps the path case and the protocol-free host and port', () => {
    expect(sameVacancyLink('https://a.com/Jobs/1', 'https://a.com/jobs/1')).toBe(false)
    expect(vacancyLinkKey('http://a.com:8080/')).toBe('a.com:8080')
  })

  it('gives no key for a link that is not http(s)', () => {
    expect(vacancyLinkKey('not a link')).toBeNull()
    expect(vacancyLinkKey('ftp://a.com/1')).toBeNull()
    expect(sameVacancyLink('not a link', 'not a link')).toBe(false)
  })
})

describe('extension ids (spec 019 NFR-002)', () => {
  it('builds the origin and the store link from one id', async () => {
    const extension = await import('../../src/shared/extension')
    expect(extension.CHROMIUM_EXTENSION_ORIGIN).toBe(
      `chrome-extension://${extension.CHROMIUM_EXTENSION_ID}/`,
    )
    expect(extension.CHROME_STORE_URL.endsWith(extension.CHROMIUM_EXTENSION_ID)).toBe(true)
    expect(extension.CHROMIUM_EXTENSION_ID).toMatch(/^[a-p]{32}$/)
  })
})
