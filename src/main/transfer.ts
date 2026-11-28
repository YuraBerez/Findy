// Spec 008: CSV files. Only paths that the user picked in a system dialog are read or
// written (FR-031); the renderer gets counts and a token, never a path.
import { basename } from 'node:path'
import { CARD_COLORS } from '../domain/colors'
import { CsvError, readCsv, writeCsv } from '../domain/csv'
import { SUPPORTED_LANGUAGES } from '../domain/language'
import { STAGES } from '../domain/stages'
import {
  COLUMNS,
  exportTable,
  fatalPlan,
  IMPORT_LIMITS,
  localOffset,
  planImport,
  type ImportPlan,
  type OffsetOf,
  type TransferLabels,
} from '../domain/transfer'
import type { Language } from '../domain/types'
import type { ExportResult, ImportPreview } from '../shared/ipc'
import { SALARY_PERIODS, SOURCE_CHANNELS, WORK_FORMATS } from '../domain/fields'
import { NotFoundError, type Repository } from './db/repository'
import { createMainTranslator } from './i18n'

/** Spec 008 plan D-3, spec 026 FR-007: export in any language, import of every language */
export const LANGUAGES: readonly Language[] = SUPPORTED_LANGUAGES

/** Headers, stage and colour names of one language, from the locale files (plan D-3). */
export function transferLabels(language: Language): TransferLabels {
  const t = createMainTranslator(language)
  const names = <T extends string>(ids: readonly T[], prefix: string) =>
    Object.fromEntries(ids.map((id) => [id, t(`${prefix}.${id}`)])) as Record<T, string>
  return {
    columns: names(COLUMNS, 'transfer.columns'),
    stages: names(STAGES, 'stages'),
    colors: names(CARD_COLORS, 'colors'),
    periods: names(SALARY_PERIODS, 'fields.periods'),
    workFormats: names(WORK_FORMATS, 'fields.workFormats'),
    channels: names(SOURCE_CHANNELS, 'fields.channels'),
  }
}

export interface TransferDeps {
  repository: Repository
  /** System save dialog; null when the user cancels */
  pickSavePath(defaultName: string): Promise<string | null>
  /** System open dialog for CSV files; null when the user cancels */
  pickOpenPath(): Promise<string | null>
  fileSize(path: string): Promise<number>
  readText(path: string): Promise<string>
  writeText(path: string, text: string): Promise<void>
  now(): Date
  newToken(): string
  offsetOf?: OffsetOf
}

export interface Transfer {
  exportCsv(language: Language): Promise<ExportResult>
  previewImport(): Promise<ImportPreview | null>
  /** Adds the rows of the previewed file; NotFoundError for an unknown token */
  confirmImport(token: string): number
}

const pad = (value: number) => String(value).padStart(2, '0')

/** FR-002: `findy-YYYY-MM-DD.csv` with the local date */
export function exportFileName(now: Date): string {
  return `findy-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.csv`
}

export function createTransfer(deps: TransferDeps): Transfer {
  const { repository } = deps
  const labels = LANGUAGES.map(transferLabels)
  /** Plan D-1: the picked file waits here until the user confirms */
  let pending: { token: string; text: string } | null = null

  const plan = (text: string): ImportPlan => {
    let rows: string[][]
    try {
      rows = readCsv(text)
    } catch (error) {
      if (error instanceof CsvError) return fatalPlan({ reason: 'notCsv' })
      throw error
    }
    return planImport(rows, {
      labels,
      existing: repository.listApplications(),
      hiddenStages: repository.getSettings().hiddenStages,
      now: deps.now().toISOString(),
    })
  }

  return {
    async exportCsv(language) {
      const path = await deps.pickSavePath(exportFileName(deps.now()))
      if (!path) return { status: 'cancelled' }
      const applications = repository.listApplications()
      const table = exportTable(
        applications,
        transferLabels(language),
        deps.offsetOf ?? localOffset,
      )
      await deps.writeText(path, writeCsv(table))
      return { status: 'saved', count: applications.length }
    },

    async previewImport() {
      const path = await deps.pickOpenPath()
      if (!path) return null
      pending = null
      const fileName = basename(path)
      // NFR-004: the size is checked before the file is read
      const text =
        (await deps.fileSize(path)) > IMPORT_LIMITS.bytes ? null : await deps.readText(path)
      const result = text === null ? fatalPlan({ reason: 'tooLarge' }) : plan(text)
      const token = text !== null && result.items.length > 0 ? deps.newToken() : null
      if (token && text !== null) pending = { token, text }
      return {
        token,
        fileName,
        fatal: result.fatal,
        toAdd: result.items.length,
        duplicates: result.duplicates,
        hidden: result.hidden,
        errors: result.errors,
      }
    },

    confirmImport(token) {
      if (!pending || pending.token !== token) throw new NotFoundError('Import', token)
      // Edge case: the board may have changed since the preview (MCP), so plan again
      const { items } = plan(pending.text)
      pending = null
      return repository.importApplications(items)
    },
  }
}
