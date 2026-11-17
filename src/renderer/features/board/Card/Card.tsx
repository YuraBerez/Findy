import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useRef, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { enteredStageAt } from '@domain/time'
import type { Application } from '@shared/ipc'
import { formatDateTime, formatSince } from '../../../format'
import { useBoardActions } from '../BoardActions'
import { CardActions } from '../CardActions'
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

/**
 * A card on the board (FR-020…025). The article is only a container: the handle
 * (card text) is the draggable button and the actions are its siblings, because a
 * button inside a button is hidden from assistive technology.
 * Click or Enter opens the details; Space picks the card up.
 */
export function SortableCard({ application }: { application: Application }) {
  const board = useBoardActions()
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
  const focus = board.focusId === application.id

  // Keyboard users keep their place after a move (constitution §VIII)
  useEffect(() => {
    if (!focus) return
    handle.current?.focus()
    board.clearFocus()
  }, [focus, board])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      // Otherwise the same Enter activates the first button of the opened panel (×)
      event.preventDefault()
      board.open(application.id)
    } else listeners?.onKeyDown?.(event)
  }

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
        onKeyDown={onKeyDown}
        // dnd-kit swallows the click that ends a drag, so this is a real click
        onClick={() => board.open(application.id)}
      >
        <CardContent application={application} />
      </div>
      <CardActions application={application} />
    </article>
  )
}
