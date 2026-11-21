import { groupByStage } from '../board'
import { sourceName } from '../fields'
import { STAGES } from '../stages'
import { enteredStageAt } from '../time'
import type { Application } from '../types'
import { COLUMNS, type TransferLabels } from './columns'
import { formatDate, localOffset, type OffsetOf } from './dates'

/** FR-006: separates the date from the stage in a history line */
export const HISTORY_SEPARATOR = ' — '

/**
 * Spec 008 FR-003…FR-006: a header row and one row per application, in board order,
 * hidden stages included. The writer (csv.ts) adds quoting and the formula guard.
 */
export function exportTable(
  applications: Application[],
  labels: TransferLabels,
  offsetOf: OffsetOf = localOffset,
): string[][] {
  const date = (iso: string) => formatDate(iso, offsetOf)
  const columns = groupByStage(applications)
  const rows = STAGES.flatMap((stage) => columns[stage]).map((application) => [
    application.title,
    application.company,
    application.url ?? '',
    labels.stages[application.stage],
    application.color ? labels.colors[application.color] : '',
    date(application.createdAt),
    date(enteredStageAt(application)),
    application.stageHistory
      .map((change) => date(change.at) + HISTORY_SEPARATOR + labels.stages[change.stage])
      .join('\n'),
    application.notes.map((note) => `[${date(note.createdAt)}]\n${note.text}`).join('\n\n'),
    // Spec 014 FR-041
    application.salary?.min?.toString() ?? '',
    application.salary?.max?.toString() ?? '',
    application.salary?.currency ?? '',
    application.salary ? labels.periods[application.salary.period] : '',
    application.workFormat ? labels.workFormats[application.workFormat] : '',
    application.location ?? '',
    application.source ? sourceName(application.source, labels.channels) : '',
    application.contactName ?? '',
    application.contactDetails ?? '',
  ])
  return [COLUMNS.map((column) => labels.columns[column]), ...rows]
}
