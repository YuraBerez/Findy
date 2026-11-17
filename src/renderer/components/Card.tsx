import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { enteredStageAt } from '../../domain/time'
import type { Application, StageId } from '../../shared/ipc'
import { formatDateTime, formatSince } from '../format'
import styles from './Card.module.css'
import { MoveMenu } from './MoveMenu'

interface CardProps {
  application: Application
  /** Copy that follows the pointer while dragging */
  overlay?: boolean
}

/** FR-003: title, company, note count, time in the current stage. */
export function Card({ application, overlay = false }: CardProps) {
  const { t, i18n } = useTranslation()
  const since = enteredStageAt(application)
  return (
    <div className={styles.body} data-overlay={overlay || undefined}>
      <h3 className={styles.title} title={application.title}>
        {application.title}
      </h3>
      <p className={styles.company} title={application.company}>
        {application.company}
      </p>
      <footer className={styles.meta}>
        <span>{t('card.notes', { count: application.notes.length })}</span>
        {/* Right edge, in line with the ⋯ button above it */}
        <time
          dateTime={since}
          title={t('card.inStage', { date: formatDateTime(since, i18n.language) })}
        >
          {formatSince(since, i18n.language)}
        </time>
      </footer>
    </div>
  )
}

interface SortableCardProps {
  application: Application
  onMove(id: string, target: { stage: StageId; index: number }): void
  focus: boolean
  onFocused(): void
}

/** A card on the board: drag with the mouse or the keyboard (FR-020…022). */
export function SortableCard({ application, onMove, focus, onFocused }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: application.id })
  const handle = useRef<HTMLDivElement | null>(null)

  // Keyboard users keep their place after a move (constitution §VIII)
  useEffect(() => {
    if (!focus) return
    handle.current?.focus()
    onFocused()
  }, [focus, onFocused])

  // The article is only a container: the handle (card text) is the draggable button and
  // the ⋯ menu is its sibling. A button inside a button hides it from assistive technology.
  return (
    <article
      ref={setNodeRef}
      className={styles.card}
      data-testid="card"
      data-dragging={isDragging || undefined}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      <div
        ref={(node) => {
          handle.current = node
          setActivatorNodeRef(node)
        }}
        className={styles.handle}
        {...attributes}
        {...listeners}
      >
        <Card application={application} />
      </div>
      <MoveMenu
        title={application.title}
        current={application.stage}
        onMove={(stage) => onMove(application.id, { stage, index: 0 })}
      />
    </article>
  )
}
