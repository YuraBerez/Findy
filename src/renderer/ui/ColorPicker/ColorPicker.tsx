import { useRef, type KeyboardEvent } from 'react'
import { ColorSwatch } from '../ColorSwatch'
import styles from './ColorPicker.module.css'

export interface ColorOption {
  key: string
  label: string
  /** A CSS colour, or `null` for "no colour" */
  color: string | null
}

interface Props {
  /** Accessible name of the group */
  label: string
  options: ColorOption[]
  value: string
  onChange(key: string): void
}

/**
 * One choice of colour (WAI-ARIA radio group): one tab stop, the arrow keys move and
 * select, Home/End go to the ends. Each option shows a sample and its name.
 */
export function ColorPicker({ label, options, value, onChange }: Props) {
  const listRef = useRef<HTMLDivElement>(null)

  const onKeyDown = (event: KeyboardEvent) => {
    const index = options.findIndex((option) => option.key === value)
    const last = options.length - 1
    const next = {
      ArrowRight: index + 1,
      ArrowDown: index + 1,
      ArrowLeft: index - 1,
      ArrowUp: index - 1,
      Home: 0,
      End: last,
    }[event.key]
    if (next === undefined) return
    event.preventDefault()
    const target = (next + options.length) % options.length
    onChange(options[target]!.key)
    listRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[target]?.focus()
  }

  return (
    <div
      ref={listRef}
      role="radiogroup"
      aria-label={label}
      className={styles.group}
      onKeyDown={onKeyDown}
    >
      {options.map((option) => {
        const checked = option.key === value
        return (
          <button
            key={option.key}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            className={styles.option}
            onClick={() => !checked && onChange(option.key)}
          >
            <ColorSwatch color={option.color} />
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
