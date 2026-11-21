import { useRef, type KeyboardEvent } from 'react'
import { panelId, tabId } from './ids'
import styles from './Tabs.module.css'

export interface TabItem<K extends string> {
  key: K
  label: string
}

interface Props<K extends string> {
  /** Accessible name of the tab list */
  label: string
  items: readonly TabItem<K>[]
  value: K
  onChange(key: K): void
  /** Ids are `${idPrefix}-tab-${key}` and `${idPrefix}-panel-${key}`: give the panels the second one */
  idPrefix: string
  /** Vertical: a side list (spec 018), with ↑ and ↓ */
  orientation?: 'horizontal' | 'vertical'
}

/**
 * ARIA tabs (WAI-ARIA APG, automatic activation): one tab stop, the arrow keys,
 * Home and End move focus and select the tab.
 */
export function Tabs<K extends string>({
  label,
  items,
  value,
  onChange,
  idPrefix,
  orientation = 'horizontal',
}: Props<K>) {
  const refs = useRef(new Map<K, HTMLButtonElement>())

  const select = (index: number) => {
    const item = items[(index + items.length) % items.length]!
    onChange(item.key)
    refs.current.get(item.key)?.focus()
  }

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const [next, previous] =
      orientation === 'vertical' ? ['ArrowDown', 'ArrowUp'] : ['ArrowRight', 'ArrowLeft']
    const target = {
      [next]: index + 1,
      [previous]: index - 1,
      Home: 0,
      End: items.length - 1,
    }[event.key]
    if (target === undefined) return
    event.preventDefault()
    select(target)
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      aria-orientation={orientation}
      className={[styles.list, styles[orientation]].join(' ')}
    >
      {items.map((item, index) => {
        const selected = item.key === value
        return (
          <button
            key={item.key}
            ref={(element) => {
              if (element) refs.current.set(item.key, element)
              else refs.current.delete(item.key)
            }}
            type="button"
            role="tab"
            id={tabId(idPrefix, item.key)}
            aria-selected={selected}
            aria-controls={panelId(idPrefix, item.key)}
            tabIndex={selected ? 0 : -1}
            className={styles.tab}
            onClick={() => onChange(item.key)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
