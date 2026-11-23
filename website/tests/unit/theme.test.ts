import { describe, expect, it } from 'vitest'
import { parseTheme } from '../../src/lib/theme'

describe('saved theme (spec 020 NFR-003)', () => {
  it('accepts only light and dark', () => {
    expect(parseTheme('light')).toBe('light')
    expect(parseTheme('dark')).toBe('dark')
    expect(parseTheme(null)).toBeNull()
    expect(parseTheme('blue')).toBeNull()
  })
})
