import type { StageId } from '../../../domain/stages'

/** Spec 002 FR-006: no application may go into a hidden column (IPC and MCP alike) */
export class HiddenStageError extends Error {
  constructor(readonly stage: StageId) {
    super(`The stage "${stage}" is hidden on the board`)
    this.name = 'HiddenStageError'
  }
}

export class NotFoundError extends Error {
  constructor(what: string, id: string) {
    super(`${what} not found: ${id}`)
    this.name = 'NotFoundError'
  }
}
