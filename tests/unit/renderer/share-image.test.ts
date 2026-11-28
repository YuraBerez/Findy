import { describe, expect, it } from 'vitest'
import { SITE_URL } from '@shared/project'
import { buildShareCard } from '../../../src/renderer/features/analytics/shareImage/content'
import {
  ellipsize,
  fitFontSize,
  fitLines,
  wrapWords,
  type Measure,
} from '../../../src/renderer/features/analytics/shareImage/draw'
import { FONT_FAMILY, LIGHT } from '../../../src/renderer/features/analytics/shareImage/palette'
import css from '../../../src/renderer/styles/global.css?raw'
import en from '../../../locales/en.json'
import uk from '../../../locales/uk.json'

/** The first `:root { … }` block: the light theme */
const lightTokens = Object.fromEntries(
  [...(/:root\s*{([^}]*)}/.exec(css)?.[1] ?? '').matchAll(/--([\w-]+):\s*([^;]+);/g)].map(
    ([, name, value]) => [name!, value!.trim()],
  ),
)

/** WCAG 2.1 contrast ratio of two #rrggbb colours */
function contrast(a: string, b: string): number {
  const luminance = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!
  }
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

function translator(language: 'en' | 'uk') {
  const messages: unknown = language === 'en' ? en : uk
  return (key: string): string => {
    const value = key
      .split('.')
      .reduce<unknown>(
        (node, part) => (node as Record<string, unknown> | undefined)?.[part],
        messages,
      )
    if (typeof value !== 'string') throw new Error(`No string ${key}`)
    return value
  }
}

// A fake font: every character is half the font size wide
const measure: Measure = (text, size) => text.length * size * 0.5

const DATA = {
  searchDays: 1234,
  totals: { applications: 40, interviews: 12, offers: 1, rejections: 9 },
  funnel: [
    { stage: 'applied' as const, count: 40, share: 1 },
    { stage: 'hr_interview' as const, count: 10, share: 0.25 },
    { stage: 'offered' as const, count: 1, share: 0.025 },
  ],
}

describe('analytics image (spec 023)', () => {
  describe('light palette (FR-014, plan D-3)', () => {
    it('is the light theme of styles/global.css', () => {
      for (const [name, value] of Object.entries(LIGHT)) expect(value, name).toBe(lightTokens[name])
      expect(css.replace(/\s+/g, ' ')).toContain(`font-family: ${FONT_FAMILY}`)
    })

    it('text has a contrast of at least 4.5 : 1 on the image and on the tiles (NFR-002)', () => {
      for (const color of [LIGHT.fg, LIGHT['fg-muted']]) {
        expect(contrast(color, LIGHT.surface)).toBeGreaterThanOrEqual(4.5)
        expect(contrast(color, LIGHT.bg)).toBeGreaterThanOrEqual(4.5)
      }
    })
  })

  describe('content (FR-011…FR-013, FR-015)', () => {
    it('has the title, the period, the tiles in screen order and the funnel in English', () => {
      const card = buildShareCard(DATA, '90d', translator('en'), 'en')
      expect(card).toMatchObject({
        title: 'Findy',
        subtitle: 'My job search',
        period: 'Last 90 days',
        funnelTitle: 'Funnel',
        site: SITE_URL.replace('https://', '').replace(/\/$/, ''),
      })
      expect(card.tiles).toEqual([
        { label: 'Days of search', value: '1,234' },
        { label: 'Applications sent', value: '40' },
        { label: 'Interviews', value: '12' },
        { label: 'Offers', value: '1' },
      ])
      expect(card.funnel[1]).toEqual({
        stage: 'hr_interview',
        label: 'HR interview',
        count: '10',
        share: '25%',
        ratio: 0.25,
      })
    })

    it('uses Ukrainian text and number formats (FR-015)', () => {
      const card = buildShareCard(DATA, '30d', translator('uk'), 'uk')
      expect(card.subtitle).toBe('Мій пошук роботи')
      expect(card.period).toBe('Останні 30 днів')
      expect(card.tiles[0]).toEqual({ label: 'Днів пошуку', value: '1 234' })
      expect(card.funnel[2]).toMatchObject({ label: 'Офер', share: '2,5%' })
    })

    it('gives no funnel rows when every funnel stage is hidden', () => {
      expect(buildShareCard({ ...DATA, funnel: [] }, 'all', translator('en'), 'en').funnel).toEqual(
        [],
      )
    })
  })

  describe('text fit (FR-016, plan D-4)', () => {
    it('lowers the size until the text fits, not below the minimum', () => {
      expect(fitFontSize('abcd', 100, 40, 10, measure)).toBe(40)
      expect(fitFontSize('abcdefghij', 100, 40, 10, measure)).toBe(20)
      expect(fitFontSize('x'.repeat(100), 100, 40, 10, measure)).toBe(10)
    })

    it('cuts a text with an ellipsis only when it does not fit', () => {
      expect(ellipsize('short', 100, 10, measure)).toBe('short')
      const cut = ellipsize('Технічна співбесіда', 50, 10, measure)
      expect(cut.endsWith('…')).toBe(true)
      expect(measure(cut, 10)).toBeLessThanOrEqual(50)
    })

    it('wraps words in lines and keeps a long word on its own line', () => {
      expect(wrapWords('Applications sent today', 70, 10, measure)).toEqual([
        'Applications',
        'sent today',
      ])
      expect(wrapWords('Supercalifragilistic', 20, 10, measure)).toEqual(['Supercalifragilistic'])
    })

    it('fits a label in two lines, or cuts the last line at the minimum size', () => {
      expect(fitLines('Надіслано заявок', 100, 2, 24, 16, measure)).toEqual({
        size: 22,
        lines: ['Надіслано', 'заявок'],
      })
      const long = fitLines('one two three four five six seven', 40, 2, 24, 16, measure)
      expect(long.size).toBe(16)
      expect(long.lines).toHaveLength(2)
      expect(long.lines[1]!.endsWith('…')).toBe(true)
      expect(long.lines.every((line) => measure(line, 16) <= 40)).toBe(true)
    })
  })
})
