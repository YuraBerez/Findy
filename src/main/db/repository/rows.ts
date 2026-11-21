// Table rows (docs/contracts/database.md) and their mapping to entities
import type { Database } from 'better-sqlite3'
import type { CardColor } from '../../../domain/colors'
import {
  isCurrency,
  isSalaryPeriod,
  isSourceChannel,
  isWorkFormat,
  type ApplicationFields,
  type ApplicationSource,
  type Salary,
} from '../../../domain/fields'
import { isNextStep, type NextStep } from '../../../domain/nextStep'
import { isKnownSiteId } from '../../../domain/sites'
import type { StageId } from '../../../domain/stages'
import type { Note } from '../../../domain/types'

export interface ApplicationRow {
  id: string
  title: string
  company: string
  url: string | null
  stage: StageId
  position: number
  color: CardColor | null
  created_at: string
  updated_at: string
  // Spec 014 (schema v4)
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  salary_period: string | null
  work_format: string | null
  location: string | null
  source_kind: string | null
  source_value: string | null
  contact_name: string | null
  contact_details: string | null
  // Spec 015 (schema v5)
  next_step_text: string | null
  next_step_date: string | null
  next_step_time: string | null
}

/** The spec 014 columns, in the order of `fieldValues` */
export const FIELD_COLUMNS = [
  'salary_min',
  'salary_max',
  'salary_currency',
  'salary_period',
  'work_format',
  'location',
  'source_kind',
  'source_value',
  'contact_name',
  'contact_details',
] as const

/** The spec 015 columns, in the order of `stepValues` */
export const STEP_COLUMNS = ['next_step_text', 'next_step_date', 'next_step_time'] as const

/** Database.md v5: a row that breaks the rules across the columns reads as no step */
export function toNextStep(row: ApplicationRow): NextStep | null {
  if (row.next_step_text === null || row.next_step_date === null) return null
  const step = { text: row.next_step_text, date: row.next_step_date, time: row.next_step_time }
  return isNextStep(step) ? step : null
}

export function stepValues(step: NextStep | null): (string | null)[] {
  return [step?.text ?? null, step?.date ?? null, step?.time ?? null]
}

export interface NoteRow {
  id: string
  application_id: string
  text: string
  created_at: string
  updated_at: string | null
}

export interface StageChangeRow {
  application_id: string
  stage: StageId
  at: string
}

/** What every store needs: the database, the clock and the id source. */
export interface StoreContext {
  db: Database
  now: () => string
  newId: () => string
}

function toSalary(row: ApplicationRow): Salary | null {
  if (row.salary_min === null && row.salary_max === null) return null
  if (!isCurrency(row.salary_currency) || !isSalaryPeriod(row.salary_period)) return null
  return {
    min: row.salary_min,
    max: row.salary_max,
    currency: row.salary_currency,
    period: row.salary_period,
  }
}

/** A value that this version does not know reads as no source (database.md, v4) */
function toSource(row: ApplicationRow): ApplicationSource | null {
  const value = row.source_value
  if (row.source_kind === 'site' && isKnownSiteId(value)) return { kind: 'site', id: value }
  if (row.source_kind === 'custom' && value) return { kind: 'custom', name: value }
  if (row.source_kind === 'channel' && isSourceChannel(value)) return { kind: 'channel', id: value }
  return null
}

export function toFields(row: ApplicationRow): ApplicationFields {
  return {
    salary: toSalary(row),
    workFormat: isWorkFormat(row.work_format) ? row.work_format : null,
    location: row.location,
    source: toSource(row),
    contactName: row.contact_name,
    contactDetails: row.contact_details,
  }
}

/** The values of `FIELD_COLUMNS` for the fields */
export function fieldValues(fields: ApplicationFields): (string | number | null)[] {
  const { salary, source } = fields
  return [
    salary?.min ?? null,
    salary?.max ?? null,
    salary?.currency ?? null,
    salary?.period ?? null,
    fields.workFormat,
    fields.location,
    source?.kind ?? null,
    source ? (source.kind === 'custom' ? source.name : source.id) : null,
    fields.contactName,
    fields.contactDetails,
  ]
}

export function toNote(row: NoteRow): Note {
  return { id: row.id, text: row.text, createdAt: row.created_at, updatedAt: row.updated_at }
}

export function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const list = map.get(key(item))
    if (list) list.push(item)
    else map.set(key(item), [item])
  }
  return map
}
