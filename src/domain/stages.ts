// Stages of the hiring process, in board order (spec 001, "Stages")
export const STAGES = [
  'applied',
  'hr_interview',
  'test_task',
  'technical_interview',
  'c_level_interview',
  'offered',
  'rejected',
] as const

export type StageId = (typeof STAGES)[number]

export const DEFAULT_STAGE: StageId = 'applied'

export function isStageId(value: unknown): value is StageId {
  return typeof value === 'string' && (STAGES as readonly string[]).includes(value)
}

/** Stages shown on the board, in board order (spec 002). */
export function visibleStages(hidden: readonly StageId[]): StageId[] {
  return STAGES.filter((stage) => !hidden.includes(stage))
}

/** Default stage of a new application: Applied, or the first visible one (spec 002 FR-007). */
export function firstVisibleStage(hidden: readonly StageId[]): StageId {
  return visibleStages(hidden)[0] ?? DEFAULT_STAGE
}
