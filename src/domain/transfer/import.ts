import { CARD_COLORS, type CardColor } from '../colors'
import { unguardCell } from '../csv'
import { EMPTY_FIELDS, type ApplicationFields } from '../fields'
import { isHttpUrl, LIMITS } from '../limits'
import { firstVisibleStage, STAGES, type StageId } from '../stages'
import type { Application, StageChange } from '../types'
import { COLUMNS, normalizeName, type Column, type TransferLabels } from './columns'
import { parseDate } from './dates'

/** NFR-004 */
export const IMPORT_LIMITS = { bytes: 10 * 1024 * 1024, rows: 5_000 } as const

export type ImportProblem = 'required' | 'tooLong' | 'invalid'

export interface ImportRowError {
  /** The row number as a spreadsheet shows it: the header is row 1 */
  row: number
  field: Column
  problem: ImportProblem
}

export type ImportFatal =
  | { reason: 'notCsv' | 'tooLarge' | 'tooManyRows' | 'noRows' }
  | { reason: 'missingColumns'; columns: ('title' | 'company')[] }

export interface ImportedApplication {
  title: string
  company: string
  url: string | null
  stage: StageId
  color: CardColor | null
  /** Spec 014 */
  fields: ApplicationFields
  createdAt: string
  stageHistory: StageChange[]
  /** Newest first, as on the board */
  notes: { text: string; createdAt: string }[]
}

export interface ImportPlan {
  fatal: ImportFatal | null
  items: ImportedApplication[]
  errors: ImportRowError[]
  duplicates: number
  /** Items that go to a hidden column (FR-016) */
  hidden: number
}

export interface ImportContext {
  /** Every language the file may use (FR-012) */
  labels: TransferLabels[]
  existing: Application[]
  hiddenStages: readonly StageId[]
  now: string
}

export function fatalPlan(fatal: ImportFatal): ImportPlan {
  return { fatal, items: [], errors: [], duplicates: 0, hidden: 0 }
}

/** Names in all languages, and the ids, to one value */
function lookup<T extends string>(
  ids: readonly T[],
  names: (labels: TransferLabels) => Record<T, string>,
  all: TransferLabels[],
): Map<string, T> {
  const map = new Map<string, T>()
  for (const id of ids) {
    map.set(normalizeName(id), id)
    for (const labels of all) map.set(normalizeName(names(labels)[id]), id)
  }
  return map
}

/** FR-015: same title, company and link, without case and outer spaces */
function duplicateKey(item: { title: string; company: string; url: string | null }): string {
  return [item.title, item.company, item.url ?? ''].map(normalizeName).join('\u0000')
}

const NOTE_DATE_LINE = /^\[(.+)\]$/

/** FR-006 format back to notes; text before the first date line is a note dated `now` */
function parseNotes(text: string, now: string): { text: string; createdAt: string }[] | null {
  const notes: { text: string; createdAt: string }[] = []
  let current: { lines: string[]; createdAt: string } = { lines: [], createdAt: now }
  const finish = () => {
    const body = current.lines.join('\n').trim()
    if (body) notes.push({ text: body, createdAt: current.createdAt })
  }
  for (const line of text.split(/\r\n|\r|\n/)) {
    const date = NOTE_DATE_LINE.exec(line.trim())
    const at = date ? parseDate(date[1]!) : null
    if (at) {
      finish()
      current = { lines: [], createdAt: at }
    } else current.lines.push(line)
  }
  finish()
  if (notes.some((note) => note.text.length > LIMITS.note)) return null
  return notes.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

const HISTORY_LINE = /^(\S+)\s+[—–-]\s+(.+)$/

/**
 * Spec 008 FR-012…FR-016: the rows of a CSV file (header first) as applications to add.
 * Nothing is written here; the main process adds `items` after the user confirms.
 */
export function planImport(rows: string[][], context: ImportContext): ImportPlan {
  // Empty records keep their place, so row numbers match the spreadsheet (FR-014)
  const records = rows.map((row, i) => ({ row: i + 1, cells: row.map(unguardCell) }))
  const filled = records.filter((record) => record.cells.length > 0)
  const header = filled[0]?.cells
  const data = filled.slice(1)
  if (!header || data.length === 0) return fatalPlan({ reason: 'noRows' })

  const columnOf = lookup(COLUMNS, (labels) => labels.columns, context.labels)
  const index = new Map<Column, number>()
  header.forEach((name, i) => {
    const column = columnOf.get(normalizeName(name))
    if (column && !index.has(column)) index.set(column, i)
  })
  const missing = (['title', 'company'] as const).filter((column) => !index.has(column))
  if (missing.length > 0) return fatalPlan({ reason: 'missingColumns', columns: missing })
  if (data.length > IMPORT_LIMITS.rows) return fatalPlan({ reason: 'tooManyRows' })

  const stageOf = lookup(STAGES, (labels) => labels.stages, context.labels)
  const colorOf = lookup(CARD_COLORS, (labels) => labels.colors, context.labels)
  const seen = new Set(context.existing.map(duplicateKey))
  const plan: ImportPlan = { fatal: null, items: [], errors: [], duplicates: 0, hidden: 0 }

  data.forEach(({ row, cells }) => {
    const rowErrors: ImportRowError[] = []
    const fail = (field: Column, problem: ImportProblem) => rowErrors.push({ row, field, problem })
    const cell = (column: Column) => {
      const at = index.get(column)
      return at === undefined ? '' : (cells[at] ?? '')
    }

    const text = (column: 'title' | 'company') => {
      const value = cell(column).trim()
      if (!value) fail(column, 'required')
      else if (value.length > LIMITS[column]) fail(column, 'tooLong')
      return value
    }
    const title = text('title')
    const company = text('company')

    const urlText = cell('url').trim()
    if (urlText.length > LIMITS.url) fail('url', 'tooLong')
    else if (urlText && !isHttpUrl(urlText)) fail('url', 'invalid')
    const url = urlText || null

    const stageText = cell('stage')
    const stage = stageText.trim()
      ? stageOf.get(normalizeName(stageText))
      : firstVisibleStage(context.hiddenStages)
    if (!stage) fail('stage', 'invalid')

    const colorText = cell('color')
    const color = colorText.trim() ? colorOf.get(normalizeName(colorText)) : null
    if (color === undefined) fail('color', 'invalid')

    const date = (column: 'createdAt' | 'inStageSince') => {
      const value = cell(column)
      if (!value.trim()) return null
      const parsed = parseDate(value)
      if (!parsed) fail(column, 'invalid')
      return parsed
    }
    const createdAt = date('createdAt') ?? context.now
    const inStageSince = date('inStageSince')

    const history: StageChange[] = []
    for (const line of cell('history').split(/\r\n|\r|\n/)) {
      if (!line.trim()) continue
      const match = HISTORY_LINE.exec(line.trim())
      const at = match ? parseDate(match[1]!) : null
      const changeStage = match ? stageOf.get(normalizeName(match[2]!)) : undefined
      if (!at || !changeStage) {
        fail('history', 'invalid')
        break
      }
      history.push({ stage: changeStage, at })
    }

    const notes = parseNotes(cell('notes'), context.now)
    if (!notes) fail('notes', 'tooLong')

    if (rowErrors.length > 0 || !stage || color === undefined || !notes) {
      plan.errors.push(...rowErrors)
      return
    }

    const item = { title, company, url }
    const key = duplicateKey(item)
    if (seen.has(key)) {
      plan.duplicates++
      return
    }
    seen.add(key)

    history.sort((a, b) => a.at.localeCompare(b.at))
    const last = history.at(-1)
    if (last?.stage !== stage) {
      const at = inStageSince ?? (history.length > 0 ? context.now : createdAt)
      history.push({ stage, at: last && last.at > at ? last.at : at })
    }

    plan.items.push({
      ...item,
      stage,
      color,
      fields: EMPTY_FIELDS,
      createdAt,
      stageHistory: history,
      notes,
    })
    if (context.hiddenStages.includes(stage)) plan.hidden++
  })
  return plan
}
