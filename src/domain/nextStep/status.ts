// Spec 015 FR-020, FR-023: what the card mark says, and when that changes.
import type { StageId } from '../stages'
import { addDays, dateKey, stepStart, type NextStep } from './types'

export type StepStatus = 'overdue' | 'today' | 'tomorrow' | 'later'

/** FR-020: overdue before today, or today after its time */
export function stepStatus(step: NextStep, now: Date): StepStatus {
  const today = dateKey(now)
  if (step.date < today) return 'overdue'
  if (step.date === today) return step.time !== null && stepStart(step) <= now ? 'overdue' : 'today'
  return step.date === addDays(today, 1) ? 'tomorrow' : 'later'
}

/** FR-020, D-5: a card in Rejected shows no mark */
export function showsStepMark(stage: StageId, step: NextStep | null): step is NextStep {
  return step !== null && stage !== 'rejected'
}

/**
 * FR-023: the next moment when a mark can change: the next local midnight, or an earlier
 * step time today.
 */
export function nextStatusChange(steps: Iterable<NextStep | null>, now: Date): Date {
  let next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  for (const step of steps) {
    if (step?.time == null) continue
    const start = stepStart(step)
    if (start > now && start < next) next = start
  }
  return next
}
