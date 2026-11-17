import { createContext, useContext } from 'react'
import type { MoveTarget } from './useBoardDnd'

/** What a card can do, given once by the Board instead of through every layer. */
export interface BoardActions {
  /** Move from the card menu; focus follows the card */
  move(id: string, target: MoveTarget): void
  /** FR-025: open the card's details */
  open(id: string): void
  /** FR-016: open the vacancy in the system browser */
  openLink(url: string): void
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
