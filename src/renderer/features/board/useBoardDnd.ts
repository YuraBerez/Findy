import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { StageId } from '@domain/stages'
import type { Application } from '@shared/ipc'
import {
  columnKeyboardCoordinates,
  dragSession,
  layoutOf,
  moveInLayout,
  stageIn,
  type Layout,
} from './dnd'

export type MoveTarget = { stage: StageId; index: number }
export type MoveHandler = (id: string, target: MoveTarget) => void

/** Drag-and-drop state of the board: preview layout, handlers, sensors, announcements. */
export function useBoardDnd(
  applications: Application[],
  visible: readonly StageId[],
  onMove: MoveHandler,
) {
  const { t } = useTranslation()
  const byId = useMemo(
    () => new Map(applications.map((application) => [application.id, application])),
    [applications],
  )
  const [preview, setPreview] = useState<Layout | null>(null)
  const [start, setStart] = useState<{ id: string; from: StageId; index: number } | null>(null)
  const [focusId, setFocusId] = useState<string | null>(null)
  const layout = preview ?? layoutOf(applications)

  const sensors = useSensors(
    // A small distance keeps clicks on the card and its actions working
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    // FR-025: only Space picks a card up; Enter opens its details
    useSensor(KeyboardSensor, {
      coordinateGetter: columnKeyboardCoordinates,
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space'] },
    }),
  )

  /**
   * After a keyboard or menu move the card remounts in its new column, so focus it
   * again (constitution §VIII). Not after a mouse drag: focus would scroll the board
   * while the user already points somewhere else.
   */
  const move = (id: string, target: MoveTarget, keepFocus: boolean) => {
    if (keepFocus) setFocusId(id)
    onMove(id, target)
  }

  /** Move from the card menu; focus follows the card */
  const moveFromMenu = useCallback(
    (id: string, target: MoveTarget) => {
      setFocusId(id)
      onMove(id, target)
    },
    [onMove],
  )
  const clearFocus = useCallback(() => setFocusId(null), [])

  const reset = () => {
    dragSession.layout = null
    setStart(null)
    setPreview(null)
  }

  const titleOf = (id: UniqueIdentifier) => byId.get(String(id))?.title ?? ''
  const stageName = (id: UniqueIdentifier) => {
    const stage = stageIn(id, dragSession.layout ?? layout)
    return stage ? t(`stages.${stage}`) : ''
  }

  const announcements: Announcements = {
    onDragStart: ({ active }) => t('dnd.picked', { title: titleOf(active.id) }),
    onDragOver: ({ active, over }) =>
      over ? t('dnd.over', { title: titleOf(active.id), stage: stageName(over.id) }) : undefined,
    onDragEnd: ({ active, over }) =>
      over ? t('dnd.dropped', { title: titleOf(active.id), stage: stageName(over.id) }) : undefined,
    onDragCancel: ({ active }) => t('dnd.cancelled', { title: titleOf(active.id) }),
  }

  const onDragStart = ({ active, activatorEvent }: DragStartEvent) => {
    const initial = layoutOf(applications)
    const from = stageIn(active.id, initial)
    if (!from) return
    dragSession.layout = initial
    dragSession.keyboard = activatorEvent instanceof KeyboardEvent
    dragSession.visible = visible
    setPreview(initial)
    setStart({ id: String(active.id), from, index: initial[from].indexOf(String(active.id)) })
  }

  // Move the card into another column while it is dragged over it
  const onDragOver = ({ active, over }: DragOverEvent) => {
    const current = dragSession.layout
    const to = over && current ? stageIn(over.id, current) : undefined
    if (!over || !current || !to) return
    const next = moveInLayout(current, String(active.id), to, String(over.id))
    if (next === current) return
    dragSession.layout = next
    setPreview(next)
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const initial = start
    const current = dragSession.layout
    const keyboard = dragSession.keyboard
    reset()
    if (!initial || !current || !over) return

    const id = String(active.id)
    const stage = stageIn(id, current)
    if (!stage) return
    let column = current[stage]
    const overIndex = column.indexOf(String(over.id))
    if (overIndex >= 0) column = arrayMove(column, column.indexOf(id), overIndex)
    const index = column.indexOf(id)
    if (stage !== initial.from || index !== initial.index) move(id, { stage, index }, keyboard)
  }

  return {
    layout,
    byId,
    sensors,
    announcements,
    dragged: start ? byId.get(start.id) : undefined,
    handlers: { onDragStart, onDragOver, onDragEnd, onDragCancel: reset },
    moveFromMenu,
    focusId,
    clearFocus,
  }
}
