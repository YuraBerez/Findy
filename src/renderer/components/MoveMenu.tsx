import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { STAGES, type StageId } from '../../domain/stages'
import styles from './MoveMenu.module.css'

interface Props {
  title: string
  current: StageId
  onMove(stage: StageId): void
}

/** FR-021: move a card to any stage without drag-and-drop. */
export function MoveMenu({ title, current, onMove }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const targets = STAGES.filter((stage) => stage !== current)

  useEffect(() => {
    if (!open) return
    menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus()
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  const closeAndFocus = () => {
    setOpen(false)
    buttonRef.current?.focus()
  }

  const onMenuKeyDown = (event: KeyboardEvent) => {
    // Keep keys away from the card's drag-and-drop keyboard handling
    event.stopPropagation()
    const items = [
      ...(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []),
    ]
    const index = items.indexOf(document.activeElement as HTMLButtonElement)
    const focus = (i: number) => items[(i + items.length) % items.length]?.focus()
    if (event.key === 'ArrowDown') focus(index + 1)
    else if (event.key === 'ArrowUp') focus(index - 1)
    else if (event.key === 'Home') focus(0)
    else if (event.key === 'End') focus(items.length - 1)
    else if (event.key === 'Escape' || event.key === 'Tab') closeAndFocus()
    else return
    event.preventDefault()
  }

  return (
    <div
      ref={rootRef}
      className={styles.root}
      // Clicks and keys here must not start dragging the card
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <button
        ref={buttonRef}
        type="button"
        className={styles.trigger}
        aria-label={t('card.actions', { title })}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={t('card.moveTo')}
          className={styles.menu}
          onKeyDown={onMenuKeyDown}
        >
          <p className={styles.heading} aria-hidden="true">
            {t('card.moveTo')}
          </p>
          {targets.map((stage) => (
            <button
              key={stage}
              type="button"
              role="menuitem"
              className={styles.item}
              onClick={() => {
                closeAndFocus()
                onMove(stage)
              }}
            >
              {t(`stages.${stage}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
