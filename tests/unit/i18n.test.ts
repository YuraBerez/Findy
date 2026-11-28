import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SUPPORTED_LANGUAGES } from '../../src/domain/language'
import { createMainTranslator } from '../../src/main/i18n'
import { STAGES } from '../../src/domain/stages'
import { resources } from '../../src/shared/i18n'

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

// Spec 026 NFR-001: every language of the app, each compared with English
const locales = Object.fromEntries(
  Object.entries(resources).map(([lang, { translation }]) => [lang, flatten(translation)]),
) as Record<string, Map<string, string>>
const others = Object.keys(locales).filter((lang) => lang !== 'en')

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
  it('exist for every supported language, and only for those', () => {
    const files = readdirSync(join(__dirname, '../../locales')).map((file) =>
      file.replace('.json', ''),
    )
    expect(files.sort()).toEqual([...SUPPORTED_LANGUAGES].sort())
    expect(Object.keys(locales).sort()).toEqual([...SUPPORTED_LANGUAGES].sort())
  })

  it.each(others)('%s has the keys of English (plural forms compared by base key)', (lang) => {
    expect([...groups(locales[lang]!).keys()].sort()).toEqual(
      [...groups(locales.en!).keys()].sort(),
    )
  })

  it.each(others)('%s uses the placeholders of English', (lang) => {
    const langGroups = groups(locales[lang]!)
    for (const [key, texts] of groups(locales.en!)) {
      const expected = [...new Set(texts.flatMap(vars))].sort()
      const actual = [...new Set((langGroups.get(key) ?? []).flatMap(vars))].sort()
      expect(actual, `${lang}: ${key}`).toEqual(expected)
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
      expect(locales.en!.has(`stages.${stage}`)).toBe(true)
    }
  })
})

describe('main-process translator', () => {
  it('translates in the chosen language with interpolation', () => {
    expect(createMainTranslator('uk')('stages.offered')).toBe('Офер')
    expect(createMainTranslator('pl')('stages.offered')).toBe('Oferta')
    expect(createMainTranslator('en')('storage.location', { dataFilePath: '/x' })).toBe(
      'Database file: /x',
    )
  })
})
