import type { ReactNode } from 'react'
import styles from './Switch.module.css'

interface Props {
  checked: boolean
  /** Accessible name; the state is aria-checked */
  label: string
  /** Tooltip, e.g. what a click does */
  title?: string
  disabled?: boolean
  /** Content of the moving knob (an icon) */
  thumb?: ReactNode
  onToggle(): void
}

export function Switch({ checked, label, title, disabled = false, thumb, onToggle }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={title}
      className={styles.track}
      disabled={disabled}
      onClick={onToggle}
    >
      <span className={styles.thumb} aria-hidden="true">
        {thumb}
      </span>
    </button>
  )
}
