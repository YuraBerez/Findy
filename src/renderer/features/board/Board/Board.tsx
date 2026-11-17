import { DndContext, DragOverlay } from '@dnd-kit/core'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { STAGES } from '@domain/stages'
import type { Application } from '@shared/ipc'
import { Button } from '@ui'
import { BoardActionsContext, type BoardActions } from '../BoardActions'
import { CardContent } from '../Card'
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
}

/** FR-001…004 and FR-020…025: stage columns with drag-and-drop (mouse and keyboard). */
export function Board({ applications, onAdd, onMove, onOpen, onOpenLink }: Props) {
  const { t } = useTranslation()
  const dnd = useBoardDnd(applications, onMove)
  const actions = useMemo<BoardActions>(
    () => ({
      move: dnd.moveFromMenu,
      open: onOpen,
      openLink: onOpenLink,
      focusId: dnd.focusId,
      clearFocus: dnd.clearFocus,
    }),
    [dnd.moveFromMenu, dnd.focusId, dnd.clearFocus, onOpen, onOpenLink],
  )

  return (
    <div className={styles.wrapper}>
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
            {STAGES.map((stage) => (
              <Column
                key={stage}
                stage={stage}
                applications={dnd.layout[stage].flatMap((id) => dnd.byId.get(id) ?? [])}
              />
            ))}
          </div>
          <DragOverlay>
            {dnd.dragged && <CardContent application={dnd.dragged} overlay />}
          </DragOverlay>
        </DndContext>
      </BoardActionsContext.Provider>
    </div>
  )
}
