import { describe, expect, it } from 'vitest'
import { CARD_COLORS, isCardColor } from '../../src/domain/colors'
import { resolveLanguage } from '../../src/domain/language'
import {
  ApplicationInputSchema,
  ApplicationPatchSchema,
  CardColorSchema,
  isHttpUrl,
  MoveTargetSchema,
  NoteTextSchema,
} from '../../src/domain/schema'
import {
  DEFAULT_STAGE,
  firstVisibleStage,
  isStageId,
  STAGES,
  visibleStages,
} from '../../src/domain/stages'

describe('stages (FR-001)', () => {
  it('has the seven stages in board order', () => {
    expect(STAGES).toEqual([
      'applied',
      'hr_interview',
      'test_task',
      'technical_interview',
      'c_level_interview',
      'offered',
      'rejected',
    ])
    expect(DEFAULT_STAGE).toBe('applied')
  })

  it('recognises stage ids', () => {
    expect(isStageId('offered')).toBe(true)
    expect(isStageId('hired')).toBe(false)
    expect(isStageId(3)).toBe(false)
  })
})

describe('ApplicationInputSchema (FR-010, FR-011)', () => {
  it('trims text and defaults url to null', () => {
    expect(ApplicationInputSchema.parse({ title: '  Dev ', company: ' Acme ' })).toEqual({
      title: 'Dev',
      company: 'Acme',
      url: null,
    })
  })

  it('treats a blank url as no url', () => {
    expect(ApplicationInputSchema.parse({ title: 'a', company: 'b', url: '   ' }).url).toBeNull()
  })

  it('accepts http(s) urls and a stage', () => {
    const parsed = ApplicationInputSchema.parse({
      title: 'a',
      company: 'b',
      url: 'https://acme.com/jobs/1',
      stage: 'test_task',
    })
    expect(parsed.url).toBe('https://acme.com/jobs/1')
    expect(parsed.stage).toBe('test_task')
  })

  it.each([
    [{ title: '', company: 'b' }],
    [{ title: '   ', company: 'b' }],
    [{ title: 'a', company: '' }],
    [{ title: 'x'.repeat(201), company: 'b' }],
    [{ title: 'a', company: 'b', url: 'acme jobs' }],
    [{ title: 'a', company: 'b', url: 'javascript:alert(1)' }],
    [{ title: 'a', company: 'b', url: `https://a.com/${'x'.repeat(2048)}` }],
    [{ title: 'a', company: 'b', stage: 'hired' }],
  ])('rejects %j', (input) => {
    expect(ApplicationInputSchema.safeParse(input).success).toBe(false)
  })
})

describe('other schemas', () => {
  it('patch fields are optional; url can be cleared', () => {
    expect(ApplicationPatchSchema.parse({})).toEqual({})
    expect(ApplicationPatchSchema.parse({ url: '' })).toEqual({ url: null })
  })

  it('move target needs a stage and a non-negative integer index', () => {
    expect(MoveTargetSchema.safeParse({ stage: 'offered', index: 0 }).success).toBe(true)
    expect(MoveTargetSchema.safeParse({ stage: 'offered', index: -1 }).success).toBe(false)
    expect(MoveTargetSchema.safeParse({ stage: 'offered', index: 1.5 }).success).toBe(false)
  })

  it('notes are 1–10 000 chars and keep line breaks (FR-030, FR-033)', () => {
    expect(NoteTextSchema.parse(' line 1\nline 2 ')).toBe('line 1\nline 2')
    expect(NoteTextSchema.safeParse(' ').success).toBe(false)
    expect(NoteTextSchema.safeParse('x'.repeat(10_001)).success).toBe(false)
  })

  it('isHttpUrl only accepts http and https', () => {
    expect(isHttpUrl('http://a.com')).toBe(true)
    expect(isHttpUrl('file:///etc/passwd')).toBe(false)
    expect(isHttpUrl('not a url')).toBe(false)
  })
})

describe('resolveLanguage (FR-041)', () => {
  it.each([
    [null, 'uk', 'uk'],
    [null, 'uk-UA', 'uk'],
    [null, 'en-US', 'en'],
    [null, 'pl', 'pl'],
    [null, 'pl_PL', 'pl'],
    [null, 'de-DE', 'en'],
    ['en', 'uk-UA', 'en'],
    ['uk', 'en-US', 'uk'],
  ] as const)('saved=%s, system=%s → %s', (saved, system, expected) => {
    expect(resolveLanguage(saved, system)).toBe(expected)
  })
})

describe('visible stages (spec 002)', () => {
  it('keeps board order and drops hidden stages', () => {
    expect(visibleStages(['test_task', 'rejected'])).toEqual([
      'applied',
      'hr_interview',
      'technical_interview',
      'c_level_interview',
      'offered',
    ])
    expect(visibleStages([])).toEqual(STAGES)
  })

  it('picks the first visible stage for new applications (FR-007)', () => {
    expect(firstVisibleStage([])).toBe('applied')
    expect(firstVisibleStage(['applied', 'hr_interview'])).toBe('test_task')
  })
})

describe('card colours (spec 007 FR-001, FR-009)', () => {
  it('has the seven colours in palette order', () => {
    expect(CARD_COLORS).toEqual(['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'grey'])
  })

  it('accepts a palette colour or null, nothing else', () => {
    expect(CardColorSchema.parse('blue')).toBe('blue')
    expect(CardColorSchema.parse(null)).toBeNull()
    expect(CardColorSchema.safeParse('pink').success).toBe(false)
    expect(CardColorSchema.safeParse(undefined).success).toBe(false)
  })

  it('isCardColor checks the palette', () => {
    expect(isCardColor('grey')).toBe(true)
    expect(isCardColor('gray')).toBe(false)
    expect(isCardColor(1)).toBe(false)
  })
})
