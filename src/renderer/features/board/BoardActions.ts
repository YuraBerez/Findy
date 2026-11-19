import { createContext, useContext } from 'react'
import type { CardColor } from '@domain/colors'
import type { StageId } from '@domain/stages'
import type { Application } from '@shared/ipc'
import type { MoveTarget } from './useBoardDnd'

/** What a card can do, given once by the Board instead of through every layer. */
export interface BoardActions {
  /** Move from the card menu; focus follows the card */
  move(id: string, target: MoveTarget): void
  /** Spec 007 FR-002 */
  setColor(id: string, color: CardColor | null): void
  /** FR-025: open the card's details */
  open(id: string): void
  /** FR-016: open the vacancy in the system browser */
  openLink(url: string): void
  /** Columns on the board, in order: the only valid move targets (spec 002) */
  visible: readonly StageId[]
  /** Spec 002 FR-001; not offered when it is the last visible column */
  hide(stage: StageId): void
  /** Spec 010 FR-003: days without movement when the card is stale, else null */
  staleDays(application: Application): number | null
  /** Card to focus after it moved (it remounts in its new column) */
  focusId: string | null
  clearFocus(): void
}

export const BoardActionsContext = createContext<BoardActions | null>(null)

export function useBoardActions(): BoardActions {
  const actions = useContext(BoardActionsContext)
  if (!actions) throw new Error('useBoardActions outside <Board>')
  return actions
}
