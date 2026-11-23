import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// One palette: every colour is a token in src/styles/global.css (docs/brand.md → Website)
const SRC = new URL('../../src/', import.meta.url).pathname
const RAW_COLOUR = /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(|color-mix\(/i

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(join(dir, entry.name))
      : /\.(astro|css)$/.test(entry.name)
        ? [join(dir, entry.name)]
        : [],
  )
}

/** The CSS of a file: a <style> block of a component, or the whole stylesheet */
const css = (file: string) => {
  const text = readFileSync(file, 'utf8')
  return file.endsWith('.css')
    ? text
    : [...text.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n')
}

describe('website palette', () => {
  it('has no colour outside the tokens of global.css', () => {
    for (const file of files(SRC).filter((f) => !f.endsWith('styles/global.css'))) {
      expect(css(file), file).not.toMatch(RAW_COLOUR)
    }
  })

  it('uses raw colours in global.css only in token definitions', () => {
    const lines = css(join(SRC, 'styles/global.css')).split('\n')
    for (const line of lines.filter((l) => RAW_COLOUR.test(l))) {
      expect(line.trim(), line).toMatch(/^--[\w-]+:/)
    }
  })
})
