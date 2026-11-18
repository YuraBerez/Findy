import { describe, expect, it } from 'vitest'
import { CsvError, guardCell, readCsv, unguardCell, writeCsv } from '../../src/domain/csv'

describe('writeCsv (spec 008 FR-007)', () => {
  it('starts with a BOM, uses commas and CRLF, quotes only where needed', () => {
    expect(
      writeCsv([
        ['Title', 'Company'],
        ['Dev', 'Acme, Inc'],
      ]),
    ).toBe('﻿Title,Company\r\nDev,"Acme, Inc"\r\n')
  })

  it('quotes line breaks, quotes and spaces at the ends', () => {
    expect(writeCsv([['a\nb', 'say "hi"', ' x', 'plain']])).toBe(
      '﻿"a\nb","say ""hi"""," x",plain\r\n',
    )
  })
})

describe('formula guard (NFR-002)', () => {
  it.each(['=SUM(A1)', '+1', '-1', '@cmd', '\tx', '\rx'])('guards %j', (value) => {
    expect(guardCell(value)).toBe(`'${value}`)
  })

  it.each(['=x', "'=x", "''=x", "'abc", 'abc', '', "'", "''"])('round-trips %j', (value) => {
    expect(unguardCell(guardCell(value))).toBe(value)
  })

  it('leaves normal text and an apostrophe before a letter alone', () => {
    expect(guardCell("'abc")).toBe("'abc")
    expect(unguardCell("'abc")).toBe("'abc")
  })

  it('writes the guard into the file', () => {
    expect(writeCsv([['=1+1']])).toBe("﻿'=1+1\r\n")
  })
})

describe('readCsv (FR-011)', () => {
  it('reads its own output back', () => {
    const rows = [
      ['Title', 'Notes'],
      ['Дизайнер 🎨', 'line 1\r\nline 2, with "quotes"'],
      [' spaced ', ''],
    ]
    expect(readCsv(writeCsv(rows)).map((row) => row.map(unguardCell))).toEqual(rows)
  })

  it('works without a BOM and with LF only', () => {
    expect(readCsv('a,b\nc,d\n')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ])
  })

  it('detects semicolons from the header row', () => {
    expect(readCsv('Title;Company\r\n"A; B";Acme, Inc\r\n')).toEqual([
      ['Title', 'Company'],
      ['A; B', 'Acme, Inc'],
    ])
  })

  it('ignores a separator inside a quoted header', () => {
    expect(readCsv('"a;b;c",d\r\n1,2')).toEqual([
      ['a;b;c', 'd'],
      ['1', '2'],
    ])
  })

  it('drops empty lines and reads a last row without a line end', () => {
    expect(readCsv('a\r\n\r\nb\r\n,\r\nc')).toEqual([['a'], ['b'], ['c']])
  })

  it('accepts a lone CR as a line end and keeps short rows short', () => {
    expect(readCsv('a,b\rc')).toEqual([['a', 'b'], ['c']])
  })

  it('returns nothing for empty text', () => {
    expect(readCsv('')).toEqual([])
    expect(readCsv('﻿')).toEqual([])
  })

  it('refuses an open quote and binary data', () => {
    expect(() => readCsv('"a,b\r\n')).toThrow(CsvError)
    expect(() => readCsv('PK\u0003\u0004\u0000')).toThrow(CsvError)
  })
})
