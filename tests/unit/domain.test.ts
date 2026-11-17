import { describe, expect, it } from 'vitest'
import { resolveLanguage } from '../../src/domain/language'
import {
  ApplicationInputSchema,
  ApplicationPatchSchema,
  isHttpUrl,
  MoveTargetSchema,
  NoteTextSchema,
} from '../../src/domain/schema'
import { DEFAULT_STAGE, isStageId, STAGES } from '../../src/domain/stages'

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
    [null, 'pl', 'en'],
    ['en', 'uk-UA', 'en'],
    ['uk', 'en-US', 'uk'],
  ] as const)('saved=%s, system=%s → %s', (saved, system, expected) => {
    expect(resolveLanguage(saved, system)).toBe(expected)
  })
})
