import { describe, expect, it } from 'vitest'
import en from '../../locales/en.json'
import uk from '../../locales/uk.json'
import { readCsv, writeCsv } from '../../src/domain/csv'
import {
  exportTable,
  formatDate,
  IMPORT_LIMITS,
  parseDate,
  planImport,
  type ImportContext,
  type TransferLabels,
} from '../../src/domain/transfer'
import type { Application } from '../../src/domain/types'

const labelsOf = (locale: typeof en): TransferLabels => ({
  columns: locale.transfer.columns,
  stages: locale.stages,
  colors: locale.colors,
})
const EN = labelsOf(en)
const UK = labelsOf(uk as typeof en)
const kyiv = () => 120
const NOW = '2026-11-18T12:00:00.000Z'

let seq = 0
function app(fields: Partial<Application> & Pick<Application, 'title'>): Application {
  const stage = fields.stage ?? 'applied'
  return {
    id: `id-${++seq}`,
    company: 'Acme',
    url: null,
    stage,
    order: 0,
    color: null,
    stageHistory: [{ stage, at: '2026-11-01T08:00:00.000Z' }],
    notes: [],
    createdAt: '2026-11-01T08:00:00.000Z',
    updatedAt: '2026-11-01T08:00:00.000Z',
    ...fields,
  }
}

const context = (extra: Partial<ImportContext> = {}): ImportContext => ({
  labels: [EN, UK],
  existing: [],
  hiddenStages: [],
  now: NOW,
  ...extra,
})

describe('dates (spec 008 FR-005)', () => {
  it('formats with the local offset, to the second', () => {
    expect(formatDate('2026-11-18T08:30:15.123Z', kyiv)).toBe('2026-11-18T10:30:15+02:00')
    expect(formatDate('2026-11-18T02:00:00.000Z', () => -330)).toBe('2026-11-17T20:30:00-05:30')
    expect(formatDate('2026-11-18T08:30:00.000Z', () => 0)).toBe('2026-11-18T08:30:00+00:00')
  })

  it('parses ISO dates back to UTC, and nothing else', () => {
    expect(parseDate('2026-11-18T10:30:15+02:00')).toBe('2026-11-18T08:30:15.000Z')
    expect(parseDate(' 2026-11-18T08:30Z ')).toBe('2026-11-18T08:30:00.000Z')
    expect(parseDate('2026-11-18')).toBe('2026-11-18T00:00:00.000Z')
    expect(parseDate('18.11.2026')).toBeNull()
    expect(parseDate('2026-13-45')).toBeNull()
    expect(parseDate('')).toBeNull()
  })
})

describe('exportTable (FR-003…FR-006)', () => {
  const board = [
    app({ title: 'Second', stage: 'hr_interview', order: 0 }),
    app({
      title: 'First',
      company: 'Globex',
      url: 'https://globex.com/1',
      color: 'green',
      order: 0,
      stage: 'hr_interview',
      stageHistory: [
        { stage: 'applied', at: '2026-11-01T08:00:00.000Z' },
        { stage: 'hr_interview', at: '2026-11-05T09:00:00.000Z' },
      ],
      notes: [
        {
          id: 'n2',
          text: 'Call on Friday',
          createdAt: '2026-11-06T10:00:00.000Z',
          updatedAt: null,
        },
        {
          id: 'n1',
          text: 'Sent CV\nwith letter',
          createdAt: '2026-11-02T10:00:00.000Z',
          updatedAt: null,
        },
      ],
    }),
    app({ title: 'Hidden', stage: 'rejected' }),
  ]
  board[0]!.order = 1

  it('writes headers and rows in board order, hidden stages included', () => {
    const [header, ...rows] = exportTable(board, EN, kyiv)
    expect(header).toEqual([
      'Title',
      'Company',
      'Link',
      'Stage',
      'Colour',
      'Created',
      'In stage since',
      'Stage history',
      'Notes',
    ])
    expect(rows.map((row) => row[0])).toEqual(['First', 'Second', 'Hidden'])
    expect(rows[0]).toEqual([
      'First',
      'Globex',
      'https://globex.com/1',
      'HR interview',
      'Green',
      '2026-11-01T10:00:00+02:00',
      '2026-11-05T11:00:00+02:00',
      '2026-11-01T10:00:00+02:00 — Applied\n2026-11-05T11:00:00+02:00 — HR interview',
      '[2026-11-06T12:00:00+02:00]\nCall on Friday\n\n[2026-11-02T12:00:00+02:00]\nSent CV\nwith letter',
    ])
    expect(rows[1]!.slice(2, 5)).toEqual(['', 'HR interview', ''])
  })

  it('uses the active language (D-4)', () => {
    const [header, row] = exportTable([board[1]!], UK, kyiv)
    expect(header![0]).toBe('Назва')
    expect(row!.slice(3, 5)).toEqual([uk.stages.hr_interview, 'Зелений'])
  })
})

describe('planImport (FR-012…FR-016)', () => {
  const plan = (csv: string, extra: Partial<ImportContext> = {}) =>
    planImport(readCsv(csv), context(extra))

  it('US-2.6: a two-column table becomes applications in the first visible stage', () => {
    const result = plan('Title,Company\r\nDev,Acme\r\nQA,Globex', { hiddenStages: ['applied'] })
    expect(result.fatal).toBeNull()
    expect(result.items).toEqual([
      {
        title: 'Dev',
        company: 'Acme',
        url: null,
        stage: 'hr_interview',
        color: null,
        createdAt: NOW,
        stageHistory: [{ stage: 'hr_interview', at: NOW }],
        notes: [],
      },
      expect.objectContaining({ title: 'QA' }),
    ])
  })

  it('matches headers without case and spaces, in Ukrainian too, and ignores others', () => {
    const result = plan(' назва ;КОМПАНІЯ;Salary;етап\r\nDev;Acme;1000;Офер')
    expect(result.items[0]).toMatchObject({ title: 'Dev', company: 'Acme', stage: 'offered' })
  })

  it('accepts stage and colour names in both languages and ids', () => {
    const result = plan(
      'Title,Company,Stage,Colour\r\na,x,Offer,Red\r\nb,x,Відмова,сірий\r\nc,x,test_task,blue',
    )
    expect(result.items.map((item) => [item.stage, item.color])).toEqual([
      ['offered', 'red'],
      ['rejected', 'grey'],
      ['test_task', 'blue'],
    ])
  })

  it.each([
    ['Title', 'missingColumns'],
    ['Company,Notes', 'missingColumns'],
  ])('refuses a file without required columns: %s', (header, reason) => {
    expect(plan(`${header}\r\nx`).fatal).toMatchObject({ reason })
  })

  it('names the missing columns', () => {
    expect(plan('Stage\r\nx').fatal).toEqual({
      reason: 'missingColumns',
      columns: ['title', 'company'],
    })
  })

  it('refuses a file with only a header, or nothing', () => {
    expect(plan('Title,Company\r\n').fatal).toEqual({ reason: 'noRows' })
    expect(plan('').fatal).toEqual({ reason: 'noRows' })
  })

  it('NFR-004: refuses more than 5 000 rows', () => {
    const csv = 'Title,Company\r\n' + 'a,b\r\n'.repeat(IMPORT_LIMITS.rows + 1)
    expect(plan(csv).fatal).toEqual({ reason: 'tooManyRows' })
  })

  it('FR-014: skips rows with bad values and lists every problem by row number', () => {
    const result = plan(
      [
        'Title,Company,Link,Stage,Colour,Created,In stage since,Stage history',
        `,${'x'.repeat(201)},ftp://a,Hired,Pink,yesterday,soon,bad line`,
        'ok,x,,,,,,',
        `a,b,https://${'x'.repeat(2048)}`,
      ].join('\r\n'),
    )
    expect(result.items.map((item) => item.title)).toEqual(['ok'])
    expect(result.errors).toEqual([
      { row: 2, field: 'title', problem: 'required' },
      { row: 2, field: 'company', problem: 'tooLong' },
      { row: 2, field: 'url', problem: 'invalid' },
      { row: 2, field: 'stage', problem: 'invalid' },
      { row: 2, field: 'color', problem: 'invalid' },
      { row: 2, field: 'createdAt', problem: 'invalid' },
      { row: 2, field: 'inStageSince', problem: 'invalid' },
      { row: 2, field: 'history', problem: 'invalid' },
      { row: 4, field: 'url', problem: 'tooLong' },
    ])
  })

  it('skips a note longer than the limit', () => {
    const result = plan(`Title,Company,Notes\r\na,b,${'x'.repeat(10_001)}`)
    expect(result.errors).toEqual([{ row: 2, field: 'notes', problem: 'tooLong' }])
  })

  it('FR-015: skips duplicates of the board and of earlier rows', () => {
    const result = plan('Title,Company,Link\r\n dev ,ACME,\r\nQA,Acme,\r\nqa,acme,', {
      existing: [app({ title: 'Dev', company: 'Acme' })],
    })
    expect(result.items.map((item) => item.title)).toEqual(['QA'])
    expect(result.duplicates).toBe(2)
  })

  it('FR-016: counts rows that go to hidden columns and keeps their stage', () => {
    const result = plan('Title,Company,Stage\r\na,x,Rejected\r\nb,x,Applied', {
      hiddenStages: ['rejected'],
    })
    expect(result.items.map((item) => item.stage)).toEqual(['rejected', 'applied'])
    expect(result.hidden).toBe(1)
  })

  it('removes the formula guard and treats a bare formula as text (NFR-002)', () => {
    const result = plan("Title,Company\r\n'=cmd,=SUM(A1)")
    expect(result.items[0]).toMatchObject({ title: '=cmd', company: '=SUM(A1)' })
  })

  it('builds history: sorted, and ends with the row stage at "In stage since"', () => {
    const result = plan(
      [
        'Title,Company,Stage,Created,In stage since,Stage history',
        'a,x,Offer,2026-11-01T10:00:00+02:00,2026-11-10T10:00:00+02:00,"2026-11-05T10:00:00+02:00 — HR interview\n2026-11-01T10:00:00+02:00 - Applied"',
        'b,x,Offer,2026-11-01T10:00:00+02:00,2026-11-10T10:00:00+02:00,',
        'c,x,Offer,2026-11-01T10:00:00+02:00,,',
      ].join('\r\n'),
    )
    expect(result.items.map((item) => item.stageHistory)).toEqual([
      [
        { stage: 'applied', at: '2026-11-01T08:00:00.000Z' },
        { stage: 'hr_interview', at: '2026-11-05T08:00:00.000Z' },
        { stage: 'offered', at: '2026-11-10T08:00:00.000Z' },
      ],
      [{ stage: 'offered', at: '2026-11-10T08:00:00.000Z' }],
      [{ stage: 'offered', at: '2026-11-01T08:00:00.000Z' }],
    ])
  })

  it('never puts the last change before the history it follows', () => {
    const result = plan(
      'Title,Company,Stage,In stage since,Stage history\r\na,x,Offer,2026-11-01,2026-11-05 — Applied',
    )
    expect(result.items[0]!.stageHistory.at(-1)).toEqual({
      stage: 'offered',
      at: '2026-11-05T00:00:00.000Z',
    })
  })

  it('reads notes: date lines start notes, free text is one note dated now', () => {
    const result = plan(
      'Title,Company,Notes\r\n' +
        'a,x,"[2026-11-02T10:00:00+02:00]\nfirst\n\nstill first\n\n[2026-11-06T10:00:00+02:00]\nsecond"\r\n' +
        'b,x,"just text\nwith lines"\r\n' +
        'c,x,"[2026-11-02T10:00:00+02:00]\n\n[not a date]\nkept"',
    )
    expect(result.items.map((item) => item.notes)).toEqual([
      [
        { text: 'second', createdAt: '2026-11-06T08:00:00.000Z' },
        { text: 'first\n\nstill first', createdAt: '2026-11-02T08:00:00.000Z' },
      ],
      [{ text: 'just text\nwith lines', createdAt: NOW }],
      [{ text: '[not a date]\nkept', createdAt: '2026-11-02T08:00:00.000Z' }],
    ])
  })
})

describe('round trip (FR-019, SC-001)', () => {
  const board = [
    app({
      title: 'Дизайнер, "senior" 🎨',
      company: '=Acme',
      url: 'https://acme.com/jobs?id=1&x=2',
      stage: 'technical_interview',
      color: 'purple',
      createdAt: '2026-10-01T07:15:30.000Z',
      stageHistory: [
        { stage: 'applied', at: '2026-10-01T07:15:30.000Z' },
        { stage: 'hr_interview', at: '2026-10-03T12:00:00.000Z' },
        { stage: 'technical_interview', at: '2026-10-09T16:45:01.000Z' },
      ],
      notes: [
        {
          id: 'b',
          text: 'Line 1\nLine 2, "quoted"\n\n- dash',
          createdAt: '2026-10-04T09:00:00.000Z',
          updatedAt: null,
        },
        { id: 'a', text: '+380 phone', createdAt: '2026-10-02T09:00:00.000Z', updatedAt: null },
      ],
    }),
    app({ title: 'Plain', stage: 'rejected' }),
  ]

  for (const [name, labels] of [
    ['en', EN],
    ['uk', UK],
  ] as const) {
    it(`export → import gives the same applications (${name})`, () => {
      const csv = writeCsv(exportTable(board, labels, kyiv))
      const result = planImport(readCsv(csv), context({ hiddenStages: ['rejected'] }))
      expect(result.errors).toEqual([])
      expect(result.items).toEqual(
        board.map(({ title, company, url, stage, color, createdAt, stageHistory, notes }) => ({
          title,
          company,
          url,
          stage,
          color,
          createdAt,
          stageHistory,
          notes: notes.map(({ text, createdAt }) => ({ text, createdAt })),
        })),
      )
      expect(result.hidden).toBe(1)
    })
  }

  it('NFR-003: 1 000 applications with 5 notes each in well under 2 s', () => {
    const many = Array.from({ length: 1_000 }, (_, i) =>
      app({
        title: `Job ${i}`,
        notes: Array.from({ length: 5 }, (_, n) => ({
          id: `${i}-${n}`,
          text: `Note ${n} with, some "text"\nand a line`,
          createdAt: `2026-11-0${n + 1}T10:00:00.000Z`,
          updatedAt: null,
        })),
      }),
    )
    const start = performance.now()
    const result = planImport(readCsv(writeCsv(exportTable(many, EN))), context())
    expect(result.items).toHaveLength(1_000)
    expect(performance.now() - start).toBeLessThan(2_000)
  })
})
