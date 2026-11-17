import { describe, expect, it } from 'vitest'
import en from '../../locales/en.json'
import uk from '../../locales/uk.json'
import { createMainTranslator } from '../../src/main/i18n'
import { STAGES } from '../../src/domain/stages'

// Locale parity (constitution §V, SC-003; docs/i18n.md)
type Tree = { [key: string]: string | Tree }

function flatten(tree: Tree, prefix = ''): Map<string, string> {
  const out = new Map<string, string>()
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') out.set(path, value)
    else for (const [k, v] of flatten(value, path)) out.set(k, v)
  }
  return out
}

const PLURAL = /_(zero|one|two|few|many|other)$/
const baseKey = (key: string) => key.replace(PLURAL, '')
const vars = (text: string) => [...text.matchAll(/{{\s*(\w+)\s*}}/g)].map((m) => m[1]).sort()

const locales = { en: flatten(en), uk: flatten(uk) }

function groups(messages: Map<string, string>): Map<string, string[]> {
  const result = new Map<string, string[]>()
  for (const [key, text] of messages) {
    const list = result.get(baseKey(key)) ?? []
    list.push(text)
    result.set(baseKey(key), list)
  }
  return result
}

describe('locales', () => {
  it('have the same keys (plural forms compared by base key)', () => {
    expect([...groups(locales.uk).keys()].sort()).toEqual([...groups(locales.en).keys()].sort())
  })

  it('use the same placeholders', () => {
    const ukGroups = groups(locales.uk)
    for (const [key, texts] of groups(locales.en)) {
      const expected = [...new Set(texts.flatMap(vars))].sort()
      const actual = [...new Set((ukGroups.get(key) ?? []).flatMap(vars))].sort()
      expect(actual, key).toEqual(expected)
    }
  })

  it('have every plural form the language needs', () => {
    for (const [lang, messages] of Object.entries(locales)) {
      const needed = new Intl.PluralRules(lang).resolvedOptions().pluralCategories
      const pluralBases = new Set([...messages.keys()].filter((k) => PLURAL.test(k)).map(baseKey))
      for (const base of pluralBases) {
        for (const category of needed) {
          expect(messages.has(`${base}_${category}`), `${lang}: ${base}_${category}`).toBe(true)
        }
      }
    }
  })

  it('have no empty strings', () => {
    for (const [lang, messages] of Object.entries(locales)) {
      for (const [key, text] of messages) expect(text.trim(), `${lang}: ${key}`).not.toBe('')
    }
  })

  it('name every stage (FR-002)', () => {
    for (const stage of STAGES) {
      expect(locales.en.has(`stages.${stage}`)).toBe(true)
    }
  })
})

describe('main-process translator', () => {
  it('translates in the chosen language with interpolation', () => {
    expect(createMainTranslator('uk')('stages.offered')).toBe('Офер')
    expect(createMainTranslator('en')('storage.location', { dataFilePath: '/x' })).toBe(
      'Database file: /x',
    )
  })
})
