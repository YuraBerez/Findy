import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { enteredStageAt } from '@domain/time'
import type { Application } from '@shared/ipc'
import { formatDateTime, formatSince } from '../../../format'
import { CardActions } from '../CardActions'
import type { MoveHandler } from '../useBoardDnd'
import styles from './Card.module.css'

interface CardContentProps {
  application: Application
  /** Copy that follows the pointer while dragging */
  overlay?: boolean
}

/** FR-003: title, company, note count, time in the current stage. */
export function CardContent({ application, overlay = false }: CardContentProps) {
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
        {/* Right edge, in line with the actions above it */}
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
  onMove: MoveHandler
  focus: boolean
  onFocused(): void
}

/**
 * A card on the board (FR-020…022). The article is only a container: the handle
 * (card text) is the draggable button and the actions are its siblings, because a
 * button inside a button is hidden from assistive technology.
 */
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
        <CardContent application={application} />
      </div>
      <CardActions
        application={application}
        onMove={(stage) => onMove(application.id, { stage, index: 0 })}
      />
    </article>
  )
}
