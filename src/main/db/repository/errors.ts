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

/** Spec 021 FR-002: an application keeps at least one stage history entry */
export class OnlyStageChangeError extends Error {
  constructor(id: string) {
    super(`The only stage history entry of application ${id} cannot be deleted`)
    this.name = 'OnlyStageChangeError'
  }
}

/** Spec 011 FR-013: the user has the most sites allowed */
export class SiteLimitError extends Error {
  constructor(readonly max: number) {
    super(`At most ${max} sites of your own`)
    this.name = 'SiteLimitError'
  }
}
