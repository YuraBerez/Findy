import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { groupByStage } from '../../domain/board'
import { isStageId, STAGES, type StageId } from '../../domain/stages'
import type { Application } from '../../shared/ipc'
import styles from './Board.module.css'
import { Card } from './Card'
import { Column, COLUMN_PREFIX } from './Column'

type Layout = Record<StageId, string[]>
type Target = { stage: StageId; index: number }

interface Props {
  applications: Application[]
  onAdd(): void
  onMove(id: string, target: Target): void
}

function layoutOf(applications: Application[]): Layout {
  const columns = groupByStage(applications)
  return Object.fromEntries(
    STAGES.map((stage) => [stage, columns[stage].map((application) => application.id)]),
  ) as Layout
}

/** Stage of a card id or a column drop id in `layout`. */
function stageIn(id: UniqueIdentifier, layout: Layout): StageId | undefined {
  const key = String(id)
  if (key.startsWith(COLUMN_PREFIX)) {
    const stage = key.slice(COLUMN_PREFIX.length)
    return isStageId(stage) ? stage : undefined
  }
  return STAGES.find((stage) => layout[stage].includes(key))
}

/**
 * Two steps, so a card lands where the user points:
 * 1. the column under the pointer (or under the dragged card, for the keyboard);
 * 2. the closest other card inside that column, or the column itself when it has none.
 * The dragged card is never a target: as a target it makes the result flip
 * between the card and the column on every pointer move.
 */
const collisionDetection: CollisionDetection = (args) => {
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

/**
 * Source of truth during a drag. React state only re-renders; handlers read this,
 * because a fast drop can arrive before React renders the last drag-over.
 * Module level is fine: there is one board, and one drag at a time.
 */
const drag: { layout: Layout | null; keyboard: boolean } = { layout: null, keyboard: false }

/** ←/→ jump to the neighbour column (also an empty one); ↑/↓ reorder in the column. */
const columnKeyboardCoordinates: KeyboardCoordinateGetter = (event, args) => {
  const step = event.code === 'ArrowRight' ? 1 : event.code === 'ArrowLeft' ? -1 : 0
  if (step === 0) return sortableKeyboardCoordinates(event, args)
  event.preventDefault()
  const { active, droppableRects, collisionRect } = args.context
  const from = active && drag.layout ? stageIn(active.id, drag.layout) : undefined
  const to = from ? STAGES[STAGES.indexOf(from) + step] : undefined
  const rect = to ? droppableRects.get(COLUMN_PREFIX + to) : undefined
  if (!rect || !collisionRect) return args.currentCoordinates
  return { x: rect.left + (rect.width - collisionRect.width) / 2, y: rect.top + 48 }
}

/** FR-001…004 and FR-020…022: stage columns with drag-and-drop (mouse and keyboard). */
export function Board({ applications, onAdd, onMove }: Props) {
  const { t } = useTranslation()
  const byId = useMemo(
    () => new Map(applications.map((application) => [application.id, application])),
    [applications],
  )
  const [dragLayout, setDragLayout] = useState<Layout | null>(null)
  const [active, setActive] = useState<{ id: string; from: StageId; index: number } | null>(null)
  const [focusId, setFocusId] = useState<string | null>(null)
  const layout = dragLayout ?? layoutOf(applications)

  const sensors = useSensors(
    // A small distance keeps clicks on the card and its menu working
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: columnKeyboardCoordinates }),
  )

  /**
   * After a keyboard or menu move the card remounts in its new column, so focus it
   * again (constitution §VIII). Not after a mouse drag: focus would scroll the board
   * while the user already points somewhere else.
   */
  const move = (id: string, target: Target, { keepFocus }: { keepFocus: boolean }) => {
    if (keepFocus) setFocusId(id)
    onMove(id, target)
  }

  const titleOf = (id: UniqueIdentifier) => byId.get(String(id))?.title ?? ''
  const stageName = (id: UniqueIdentifier) => {
    const stage = stageIn(id, drag.layout ?? layout)
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

  const reset = () => {
    drag.layout = null
    setActive(null)
    setDragLayout(null)
  }

  const handleDragStart = ({ active, activatorEvent }: DragStartEvent) => {
    const start = layoutOf(applications)
    const from = stageIn(active.id, start)
    if (!from) return
    drag.layout = start
    drag.keyboard = activatorEvent instanceof KeyboardEvent
    setDragLayout(start)
    setActive({ id: String(active.id), from, index: start[from].indexOf(String(active.id)) })
  }

  // Move the card into another column while it is dragged over it
  const handleDragOver = ({ active, over }: DragOverEvent) => {
    const current = drag.layout
    if (!over || !current) return
    const from = stageIn(active.id, current)
    const to = stageIn(over.id, current)
    if (!from || !to || from === to) return
    const id = String(active.id)
    const target = current[to]
    const overIndex = target.indexOf(String(over.id))
    const index = overIndex >= 0 ? overIndex : target.length
    const next = {
      ...current,
      [from]: current[from].filter((item) => item !== id),
      [to]: [...target.slice(0, index), id, ...target.slice(index)],
    }
    drag.layout = next
    setDragLayout(next)
  }

  const handleDragEnd = ({ active: dragged, over }: DragEndEvent) => {
    const start = active
    const current = drag.layout
    reset()
    if (!start || !current || !over) return

    const id = String(dragged.id)
    const stage = stageIn(id, current)
    if (!stage) return
    let column = current[stage]
    const overIndex = column.indexOf(String(over.id))
    if (overIndex >= 0) column = arrayMove(column, column.indexOf(id), overIndex)
    const index = column.indexOf(id)

    if (stage !== start.from || index !== start.index) {
      move(id, { stage, index }, { keepFocus: drag.keyboard })
    }
  }

  const activeApplication = active ? byId.get(active.id) : undefined

  return (
    <div className={styles.wrapper}>
      {applications.length === 0 && (
        <section className={styles.empty} data-testid="empty-board">
          <h2>{t('board.emptyTitle')}</h2>
          <p>{t('board.emptyHint')}</p>
          <button type="button" className="button button--primary" onClick={onAdd}>
            {t('toolbar.addApplication')}
          </button>
        </section>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        accessibility={{
          announcements,
          screenReaderInstructions: { draggable: t('dnd.instructions') },
        }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={reset}
      >
        {/* Focusable, so the horizontal scroll works from the keyboard too */}
        <div className={styles.board} role="list" aria-label={t('board.label')} tabIndex={0}>
          {STAGES.map((stage) => (
            <Column
              key={stage}
              stage={stage}
              applications={layout[stage].flatMap((id) => byId.get(id) ?? [])}
              onMove={(id, target) => move(id, target, { keepFocus: true })}
              focusId={focusId}
              onFocused={() => setFocusId(null)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeApplication && <Card application={activeApplication} overlay />}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
