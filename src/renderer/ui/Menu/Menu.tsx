import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { IconButton } from '../IconButton'
import { CheckIcon, ChevronIcon } from '../icons'
import { SwitchVisual } from '../Switch'
import styles from './Menu.module.css'

export interface MenuAction {
  key: string
  label: string
  onSelect(): void
  disabled?: boolean
  /** Destructive action: shown in the danger colour */
  danger?: boolean
}

/** On/off item that stays open (WAI-ARIA menuitemcheckbox), shown as a switch */
export interface MenuToggle {
  key: string
  toggle: true
  label: string
  checked: boolean
  /** Icon in the switch knob, e.g. sun or moon */
  thumb?: ReactNode
  onToggle(): void
}

/**
 * A choice of one option in its own panel ("Language: English ›"), so a long list
 * (more languages later) never makes the main menu longer.
 */
export interface MenuSubmenu {
  key: string
  submenu: true
  label: string
  /** The current choice, shown next to the label */
  value: string
  backLabel: string
  options: { key: string; label: string; checked: boolean; lang?: string; onSelect(): void }[]
}

export interface MenuSeparator {
  key: string
  separator: true
}

export type MenuEntry = MenuAction | MenuToggle | MenuSubmenu | MenuSeparator

interface Props {
  /** Accessible name of the trigger button */
  triggerLabel: string
  triggerIcon: ReactNode
  /** Accessible name of the menu */
  label: string
  /** Small visible heading above the items, e.g. "Move to" */
  heading?: string
  items: MenuEntry[]
}

const ITEMS = '[role^="menuitem"]:not(:disabled)'

/**
 * Menu button (WAI-ARIA pattern): Enter/Space opens and focuses the first item,
 * ↑/↓/Home/End move, Enter picks, Escape/Tab close and return focus to the trigger.
 * A submenu opens in place with → or Enter; ← or Escape goes back.
 */
export function Menu({ triggerLabel, triggerIcon, label, heading, items }: Props) {
  const [open, setOpen] = useState(false)
  const [panel, setPanel] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const submenu = items.find((item): item is MenuSubmenu => 'submenu' in item && item.key === panel)

  // Focus the first item when the menu or a panel opens (the checked one in a submenu)
  useEffect(() => {
    if (!open) return
    const list = listRef.current
    ;(
      list?.querySelector<HTMLButtonElement>('[aria-checked="true"][role="menuitemradio"]') ??
      list?.querySelector<HTMLButtonElement>(ITEMS)
    )?.focus()
  }, [open, panel])

  useEffect(() => {
    if (!open) return
    const closeOnOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutside)
    return () => document.removeEventListener('pointerdown', closeOnOutside)
  }, [open])

  const close = () => {
    setOpen(false)
    setPanel(null)
    triggerRef.current?.focus()
  }

  const pick = (onSelect: () => void) => () => {
    close()
    onSelect()
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const all = [...(listRef.current?.querySelectorAll<HTMLButtonElement>(ITEMS) ?? [])]
    const current = document.activeElement as HTMLButtonElement
    const index = all.indexOf(current)
    const focus = (i: number) => all[(i + all.length) % all.length]?.focus()
    if (event.key === 'ArrowDown') focus(index + 1)
    else if (event.key === 'ArrowUp') focus(index - 1)
    else if (event.key === 'Home') focus(0)
    else if (event.key === 'End') focus(all.length - 1)
    else if (event.key === 'ArrowRight' && current.dataset.submenu)
      setPanel(current.dataset.submenu)
    else if ((event.key === 'ArrowLeft' || event.key === 'Escape') && panel) setPanel(null)
    else if (event.key === 'Escape' || event.key === 'Tab') close()
    else return
    event.preventDefault()
  }

  const renderEntry = (item: MenuEntry) => {
    if ('separator' in item)
      return <hr key={item.key} role="separator" className={styles.separator} />
    if ('toggle' in item)
      return (
        <button
          key={item.key}
          type="button"
          role="menuitemcheckbox"
          aria-checked={item.checked}
          className={[styles.item, styles.toggle].join(' ')}
          // Stays open, so the user sees the switch move
          onClick={item.onToggle}
        >
          <span className={styles.grow}>{item.label}</span>
          <SwitchVisual checked={item.checked} thumb={item.thumb} />
        </button>
      )
    if ('submenu' in item)
      return (
        <button
          key={item.key}
          type="button"
          role="menuitem"
          aria-haspopup="menu"
          data-submenu={item.key}
          className={styles.item}
          onClick={() => setPanel(item.key)}
        >
          <span className={styles.grow}>{item.label}</span>
          <span className={styles.value}>{item.value}</span>
          <ChevronIcon size={14} />
        </button>
      )
    return (
      <button
        key={item.key}
        type="button"
        role="menuitem"
        className={styles.item}
        disabled={item.disabled}
        data-danger={item.danger || undefined}
        onClick={pick(item.onSelect)}
      >
        {item.label}
      </button>
    )
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
        onClick={() => (open ? close() : setOpen(true))}
      />
      {open && (
        <div
          ref={listRef}
          id={menuId}
          role="menu"
          aria-label={submenu ? submenu.label : label}
          className={styles.menu}
          onKeyDown={onKeyDown}
        >
          {submenu ? (
            <>
              <button
                type="button"
                role="menuitem"
                className={styles.item}
                onClick={() => setPanel(null)}
              >
                <ChevronIcon size={14} className={styles.back} />
                {submenu.backLabel}
              </button>
              <hr role="separator" className={styles.separator} />
              {submenu.options.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  role="menuitemradio"
                  aria-checked={option.checked}
                  lang={option.lang}
                  className={styles.item}
                  onClick={pick(option.onSelect)}
                >
                  <span className={styles.check} aria-hidden="true">
                    {option.checked && <CheckIcon size={14} />}
                  </span>
                  {option.label}
                </button>
              ))}
            </>
          ) : (
            <>
              {heading && (
                <p className={styles.heading} aria-hidden="true">
                  {heading}
                </p>
              )}
              {items.map(renderEntry)}
            </>
          )}
        </div>
      )}
    </div>
  )
}
