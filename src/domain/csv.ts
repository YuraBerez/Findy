// CSV as in RFC 4180, for spec 008. Pure: no files, no Electron.

const BOM = '\uFEFF'
const CRLF = '\r\n'

/** A cell starting with one of these runs as a formula in a spreadsheet (NFR-002) */
const FORMULA_START = new Set(['=', '+', '-', '@', '\t', '\r'])

export class CsvError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CsvError'
  }
}

/**
 * NFR-002: a leading apostrophe stops a spreadsheet from running the cell. A value that
 * already starts with an apostrophe before such a character gets one more, so that
 * `unguardCell` always gives the original back.
 */
export function guardCell(value: string): string {
  const first = value.charAt(0)
  const guarded = FORMULA_START.has(first) || (first === "'" && isGuarded(value))
  return guarded ? `'${value}` : value
}

/** The opposite of `guardCell`. */
export function unguardCell(value: string): string {
  return isGuarded(value) ? value.slice(1) : value
}

function isGuarded(value: string): boolean {
  const second = value.charAt(1)
  return value.startsWith("'") && (FORMULA_START.has(second) || second === "'")
}

function quote(value: string): string {
  const needsQuotes = /[",\r\n]/.test(value) || value !== value.trim()
  return needsQuotes ? `"${value.replaceAll('"', '""')}"` : value
}

/** FR-007: UTF-8 BOM, commas, CRLF; quotes only where needed; formula guard on every cell. */
export function writeCsv(rows: readonly (readonly string[])[]): string {
  return (
    BOM + rows.map((row) => row.map((cell) => quote(guardCell(cell))).join(',') + CRLF).join('')
  )
}

/** `;` when the header row has more semicolons than commas outside quotes, else `,` */
function detectSeparator(text: string): ',' | ';' {
  let commas = 0
  let semicolons = 0
  let quoted = false
  for (const char of text) {
    if (char === '"') quoted = !quoted
    else if (quoted) continue
    else if (char === '\n' || char === '\r') break
    else if (char === ',') commas++
    else if (char === ';') semicolons++
  }
  return semicolons > commas ? ';' : ','
}

/**
 * FR-011: with or without a BOM, `,` or `;` (from the header row), CRLF or LF, quoted
 * cells with separators, quotes and line breaks. Empty lines are dropped.
 * Throws CsvError for text that cannot be CSV.
 */
export function readCsv(input: string): string[][] {
  const text = input.startsWith(BOM) ? input.slice(1) : input
  if (text.includes('\u0000')) throw new CsvError('Binary data')
  const separator = detectSeparator(text)
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  let i = 0

  const endCell = () => {
    row.push(cell)
    cell = ''
  }
  const endRow = () => {
    endCell()
    if (row.some((value) => value !== '')) rows.push(row)
    row = []
  }

  while (i < text.length) {
    const char = text[i]!
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"'
        i++
      } else if (char === '"') quoted = false
      else cell += char
    } else if (char === '"' && cell === '') quoted = true
    else if (char === separator) endCell()
    else if (char === '\r' && text[i + 1] === '\n') {
      endRow()
      i++
    } else if (char === '\n' || char === '\r') endRow()
    else cell += char
    i++
  }
  if (quoted) throw new CsvError('Unterminated quote')
  if (cell !== '' || row.length > 0) endRow()
  return rows
}
