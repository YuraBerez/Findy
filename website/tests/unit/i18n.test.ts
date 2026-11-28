import { describe, expect, it } from 'vitest'
import { MESSAGES, format, formatSize } from '../../src/i18n'
import { LANGS } from '../../src/lib/paths'

/** Every key path of a messages object, with array items by index */
function keys(value: unknown, prefix = ''): string[] {
  if (typeof value === 'string') return [prefix]
  return Object.entries(value as object).flatMap(([key, child]) =>
    keys(child, prefix ? `${prefix}.${key}` : key),
  )
}

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()

describe('website text (spec 020 US-3, plan D-3)', () => {
  // Spec 027 FR-007: every language against English
  const others = LANGS.filter((lang) => lang !== 'en')

  it.each(others)('has the same keys in English and %s', (lang) => {
    expect(keys(MESSAGES[lang])).toEqual(keys(MESSAGES.en))
  })

  it.each(others)('%s has the same placeholders and no empty text', (lang) => {
    const get = (obj: unknown, path: string) =>
      path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], obj) as string
    for (const path of keys(MESSAGES.en)) {
      const en = get(MESSAGES.en, path)
      const text = get(MESSAGES[lang], path)
      expect(text.trim(), path).not.toBe('')
      expect(placeholders(text), path).toEqual(placeholders(en))
    }
  })

  it('uses the Ukrainian apostrophe', () => {
    expect(JSON.stringify(MESSAGES.uk)).not.toMatch(/[а-яіїєґ]['’][а-яіїєґ]/i)
  })

  it('fills in placeholders and keeps unknown ones', () => {
    expect(format('Version {version}', { version: '1.0.0' })).toBe('Version 1.0.0')
    expect(format('{a} {b}', { a: 'x' })).toBe('x {b}')
  })

  it('formats a size in the language', () => {
    expect(formatSize(92_400_000, 'en')).toMatch(/^92\sMB$/)
    expect(formatSize(92_400_000, 'uk')).toMatch(/^92\sМБ$/)
    expect(formatSize(41_200, 'en')).toMatch(/^41\skB$/)
    expect(formatSize(41_200, 'uk')).toMatch(/^41\sкБ$/)
  })
})
