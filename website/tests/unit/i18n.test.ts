import { describe, expect, it } from 'vitest'
import { MESSAGES, format, formatSize } from '../../src/i18n'

/** Every key path of a messages object, with array items by index */
function keys(value: unknown, prefix = ''): string[] {
  if (typeof value === 'string') return [prefix]
  return Object.entries(value as object).flatMap(([key, child]) =>
    keys(child, prefix ? `${prefix}.${key}` : key),
  )
}

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()

describe('website text (spec 020 US-3, plan D-3)', () => {
  it('has the same keys in English and Ukrainian', () => {
    expect(keys(MESSAGES.uk)).toEqual(keys(MESSAGES.en))
  })

  it('has the same placeholders and no empty text', () => {
    const get = (obj: unknown, path: string) =>
      path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], obj) as string
    for (const path of keys(MESSAGES.en)) {
      const en = get(MESSAGES.en, path)
      const uk = get(MESSAGES.uk, path)
      expect(uk.trim(), path).not.toBe('')
      expect(placeholders(uk), path).toEqual(placeholders(en))
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
