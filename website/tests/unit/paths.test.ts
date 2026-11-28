import { describe, expect, it } from 'vitest'
import { guidePage, isLang, pagePath, withBase } from '../../src/lib/paths'

describe('page paths (spec 020 FR-020, FR-021)', () => {
  it('puts English at the root and Ukrainian under uk/', () => {
    expect(pagePath('en')).toBe('')
    expect(pagePath('uk')).toBe('uk/')
    expect(pagePath('en', guidePage('install'))).toBe('guide/install/')
    expect(pagePath('uk', guidePage('install'))).toBe('uk/guide/install/')
  })

  it('puts Polish under pl/ (spec 027)', () => {
    expect(pagePath('pl', guidePage('install'))).toBe('pl/guide/install/')
  })

  it('knows the languages of the website', () => {
    expect(isLang('uk')).toBe(true)
    expect(isLang('pl')).toBe(true)
    expect(isLang('de')).toBe(false)
  })

  it('joins the base with a path, with or without a slash at the end of the base', () => {
    expect(withBase('/Findy/', 'uk/')).toBe('/Findy/uk/')
    expect(withBase('/Findy', 'uk/')).toBe('/Findy/uk/')
  })
})
