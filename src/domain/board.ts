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

/**
 * Optimistic copy of Repository.moveApplication (FR-020…024) for the renderer:
 * the board shows the move at once, then main returns the saved state.
 */
export function applyMove(
  applications: Application[],
  id: string,
  target: { stage: StageId; index: number },
  now: string,
): Application[] {
  const moving = applications.find((application) => application.id === id)
  if (!moving) return applications

  const columns = groupByStage(applications.filter((application) => application.id !== id))
  const stageChanged = moving.stage !== target.stage
  const moved: Application = {
    ...moving,
    stage: target.stage,
    updatedAt: now,
    stageHistory: stageChanged
      ? [...moving.stageHistory, { stage: target.stage, at: now }]
      : moving.stageHistory,
  }
  const column = columns[target.stage]
  column.splice(Math.min(target.index, column.length), 0, moved)

  return STAGES.flatMap((stage) =>
    columns[stage].map((application, order) => ({ ...application, order })),
  )
}
