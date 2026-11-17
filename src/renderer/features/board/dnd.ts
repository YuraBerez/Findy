// Drag-and-drop rules of the board (FR-020…022), free of React.
import {
  closestCenter,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
  type KeyboardCoordinateGetter,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { groupByStage } from '@domain/board'
import { isStageId, STAGES, type StageId } from '@domain/stages'
import type { Application } from '@shared/ipc'

/** Card ids per stage, in board order */
export type Layout = Record<StageId, string[]>

/** Droppable id of a whole column (so empty columns accept cards) */
export const COLUMN_PREFIX = 'column:'

export function layoutOf(applications: Application[]): Layout {
  const columns = groupByStage(applications)
  return Object.fromEntries(
    STAGES.map((stage) => [stage, columns[stage].map((application) => application.id)]),
  ) as Layout
}

/** Stage of a card id or a column drop id in `layout`. */
export function stageIn(id: UniqueIdentifier, layout: Layout): StageId | undefined {
  const key = String(id)
  if (key.startsWith(COLUMN_PREFIX)) {
    const stage = key.slice(COLUMN_PREFIX.length)
    return isStageId(stage) ? stage : undefined
  }
  return STAGES.find((stage) => layout[stage].includes(key))
}

/** `layout` with `id` moved into `to`, at the position of `overId` or at the end. */
export function moveInLayout(layout: Layout, id: string, to: StageId, overId: string): Layout {
  const from = stageIn(id, layout)
  if (!from || from === to) return layout
  const target = layout[to]
  const overIndex = target.indexOf(overId)
  const index = overIndex >= 0 ? overIndex : target.length
  return {
    ...layout,
    [from]: layout[from].filter((item) => item !== id),
    [to]: [...target.slice(0, index), id, ...target.slice(index)],
  }
}

/**
 * Source of truth during a drag. React state only re-renders; handlers read this,
 * because a fast drop can arrive before React renders the last drag-over.
 * Module level is fine: there is one board, and one drag at a time.
 */
export const dragSession: {
  layout: Layout | null
  keyboard: boolean
  visible: readonly StageId[]
} = {
  layout: null,
  keyboard: false,
  /** Columns on the board; the keyboard moves between these only (spec 002) */
  visible: STAGES,
}

/**
 * Two steps, so a card lands where the user points:
 * 1. the column under the pointer (or under the dragged card, for the keyboard);
 * 2. the closest other card inside that column, or the column itself when it has none.
 * The dragged card is never a target: as a target it makes the result flip
 * between the card and the column on every pointer move.
 */
export const collisionDetection: CollisionDetection = (args) => {
  const underPointer = pointerWithin(args)
  const hits = underPointer.length > 0 ? underPointer : rectIntersection(args)
  const column = hits.find((hit) => String(hit.id).startsWith(COLUMN_PREFIX))
  if (!column) return []
  const stage = String(column.id).slice(COLUMN_PREFIX.length)
  const cards = args.droppableContainers.filter(
    (container) =>
      container.id !== args.active.id && container.data.current?.sortable?.containerId === stage,
  )
  return cards.length > 0 ? closestCenter({ ...args, droppableContainers: cards }) : [column]
}

/** ←/→ jump to the neighbour column (also an empty one); ↑/↓ reorder in the column. */
export const columnKeyboardCoordinates: KeyboardCoordinateGetter = (event, args) => {
  const step = event.code === 'ArrowRight' ? 1 : event.code === 'ArrowLeft' ? -1 : 0
  if (step === 0) return sortableKeyboardCoordinates(event, args)
  event.preventDefault()
  const { active, droppableContainers, collisionRect } = args.context
  const from = active && dragSession.layout ? stageIn(active.id, dragSession.layout) : undefined
  const { visible } = dragSession
  const to = from ? visible[visible.indexOf(from) + step] : undefined
  const column = to ? droppableContainers.get(COLUMN_PREFIX + to)?.node.current : undefined
  if (!column || !collisionRect) return args.currentCoordinates
  // On a small window the next column can be off screen: show it first, then aim at
  // its fresh position. Otherwise the sensor only scrolls and the card stays put.
  column.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  const rect = column.getBoundingClientRect()
  return { x: rect.left + (rect.width - collisionRect.width) / 2, y: rect.top + 48 }
}
