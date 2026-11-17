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
