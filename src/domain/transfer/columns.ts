import type { CardColor } from '../colors'
import type { SalaryPeriod, SourceChannel, WorkFormat } from '../fields'
import type { StageId } from '../stages'

/** Spec 008 FR-003: the columns of the file, in this order */
export const COLUMNS = [
  'title',
  'company',
  'url',
  'stage',
  'color',
  'createdAt',
  'inStageSince',
  'history',
  'notes',
  // Spec 014 FR-041
  'salaryMin',
  'salaryMax',
  'currency',
  'salaryPeriod',
  'workFormat',
  'location',
  'source',
  'contactName',
  'contactDetails',
  // Spec 015 FR-051
  'nextStep',
  'nextStepDate',
] as const

export type Column = (typeof COLUMNS)[number]

/** The words of the file in one language: headers, stage and colour names (spec D-4). */
export interface TransferLabels {
  columns: Record<Column, string>
  stages: Record<StageId, string>
  colors: Record<CardColor, string>
  /** Spec 014 FR-041 */
  periods: Record<SalaryPeriod, string>
  workFormats: Record<WorkFormat, string>
  channels: Record<SourceChannel, string>
}

/** FR-012: headers and names are matched without case and outer spaces */
export function normalizeName(value: string): string {
  return value.trim().toLocaleLowerCase()
}
