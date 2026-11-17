import { STAGES, type StageId } from './stages'
import type { Application } from './types'

/** Applications grouped by stage, in board order, each column sorted by `order`. */
export function groupByStage(applications: Application[]): Record<StageId, Application[]> {
  const columns = Object.fromEntries(STAGES.map((stage) => [stage, [] as Application[]])) as Record<
    StageId,
    Application[]
  >
  for (const application of applications) columns[application.stage].push(application)
  for (const stage of STAGES) columns[stage].sort((a, b) => a.order - b.order)
  return columns
}
