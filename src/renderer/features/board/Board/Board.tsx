import { DndContext, DragOverlay } from '@dnd-kit/core'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { CardColor } from '@domain/colors'
import { filterApplications, toFullIndex } from '@domain/search'
import { staleDays } from '@domain/stale'
import { visibleStages, type StageId } from '@domain/stages'
import type { Application } from '@shared/ipc'
import { Button } from '@ui'
import { BoardActionsContext, type BoardActions } from '../BoardActions'
import { CardContent } from '../Card'
import { useFieldLabels } from '../../fields'
import { Column } from '../Column'
import { collisionDetection } from '../dnd'
import { useBoardDnd, type MoveHandler } from '../useBoardDnd'
import styles from './Board.module.css'

interface Props {
  applications: Application[]
  onAdd(): void
  onMove: MoveHandler
  onOpen(id: string): void
  onOpenLink(url: string): void
  onColorChange(id: string, color: CardColor | null): void
  hiddenStages: StageId[]
  onHide(stage: StageId): void
  /** FR-060: show only the cards that match */
  query: string
  /** Spec 010: N and the current time (ticks hourly) for the stale marks */
  staleAfterDays: number
  now: Date
}

/** FR-001…004 and FR-020…025: stage columns with drag-and-drop (mouse and keyboard). */
export function Board({
  applications,
  onAdd,
  onMove,
  onOpen,
  onOpenLink,
  onColorChange,
  hiddenStages,
  onHide,
  query,
  staleAfterDays,
  now,
}: Props) {
  const { t } = useTranslation()
  const visible = useMemo(() => visibleStages(hiddenStages), [hiddenStages])
  const staleOf = useCallback(
    (application: Application) => staleDays(application, staleAfterDays, now),
    [staleAfterDays, now],
  )
  const { channels } = useFieldLabels()
  const shown = useMemo(
    () => filterApplications(applications, query, channels),
    [applications, query, channels],
  )
  // Positions in a filtered column become positions in the whole column
  const move = useCallback<MoveHandler>(
    (id, target) =>
      onMove(
        id,
        query.trim() ? { ...target, index: toFullIndex(applications, shown, id, target) } : target,
      ),
    [onMove, query, applications, shown],
  )
  const dnd = useBoardDnd(shown, visible, move)
  const actions = useMemo<BoardActions>(
    () => ({
      move: dnd.moveFromMenu,
      setColor: onColorChange,
      open: onOpen,
      openLink: onOpenLink,
      visible,
      hide: onHide,
      staleDays: staleOf,
      focusId: dnd.focusId,
      clearFocus: dnd.clearFocus,
    }),
    [
      dnd.moveFromMenu,
      dnd.focusId,
      dnd.clearFocus,
      onColorChange,
      onOpen,
      onOpenLink,
      visible,
      onHide,
      staleOf,
    ],
  )

  return (
    <div className={styles.wrapper}>
      {query.trim() && applications.length > 0 && shown.length === 0 && (
        <p className={styles.noResults} role="status">
          {t('search.noResults', { query: query.trim() })}
        </p>
      )}
      {applications.length === 0 && (
        <section className={styles.empty} data-testid="empty-board">
          <h2>{t('board.emptyTitle')}</h2>
          <p>{t('board.emptyHint')}</p>
          <Button variant="primary" onClick={onAdd}>
            {t('toolbar.addApplication')}
          </Button>
        </section>
      )}
      <BoardActionsContext.Provider value={actions}>
        <DndContext
          sensors={dnd.sensors}
          collisionDetection={collisionDetection}
          accessibility={{
            announcements: dnd.announcements,
            screenReaderInstructions: { draggable: t('dnd.instructions') },
          }}
          {...dnd.handlers}
        >
          {/* Focusable, so the horizontal scroll works from the keyboard too */}
          <div className={styles.board} role="list" aria-label={t('board.label')} tabIndex={0}>
            {/* Hidden columns are not rendered, so nothing can be dropped there */}
            {visible.map((stage) => (
              <Column
                key={stage}
                stage={stage}
                applications={dnd.layout[stage].flatMap((id) => dnd.byId.get(id) ?? [])}
              />
            ))}
          </div>
          <DragOverlay>
            {dnd.dragged && (
              <CardContent application={dnd.dragged} staleDays={staleOf(dnd.dragged)} overlay />
            )}
          </DragOverlay>
        </DndContext>
      </BoardActionsContext.Provider>
    </div>
  )
}
