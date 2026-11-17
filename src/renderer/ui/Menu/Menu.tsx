import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { IconButton } from '../IconButton'
import styles from './Menu.module.css'

export interface MenuItem {
  key: string
  label: string
  onSelect(): void
}

interface Props {
  /** Accessible name of the trigger button */
  triggerLabel: string
  triggerIcon: ReactNode
  /** Accessible name and visible heading of the menu */
  label: string
  items: MenuItem[]
}

/**
 * Menu button (WAI-ARIA pattern): Enter/Space opens and focuses the first item,
 * ↑/↓/Home/End move, Enter picks, Escape/Tab close and return focus to the trigger.
 */
export function Menu({ triggerLabel, triggerIcon, label, items }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    listRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus()
    const closeOnOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutside)
    return () => document.removeEventListener('pointerdown', closeOnOutside)
  }, [open])

  const close = () => {
    setOpen(false)
    triggerRef.current?.focus()
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const all = [
      ...(listRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []),
    ]
    const index = all.indexOf(document.activeElement as HTMLButtonElement)
    const focus = (i: number) => all[(i + all.length) % all.length]?.focus()
    if (event.key === 'ArrowDown') focus(index + 1)
    else if (event.key === 'ArrowUp') focus(index - 1)
    else if (event.key === 'Home') focus(0)
    else if (event.key === 'End') focus(all.length - 1)
    else if (event.key === 'Escape' || event.key === 'Tab') close()
    else return
    event.preventDefault()
  }

  return (
    <div ref={rootRef} className={styles.root}>
      <IconButton
        ref={triggerRef}
        label={triggerLabel}
        icon={triggerIcon}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
      />
      {open && (
        <div
          ref={listRef}
          id={menuId}
          role="menu"
          aria-label={label}
          className={styles.menu}
          onKeyDown={onKeyDown}
        >
          <p className={styles.heading} aria-hidden="true">
            {label}
          </p>
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              className={styles.item}
              onClick={() => {
                close()
                item.onSelect()
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
