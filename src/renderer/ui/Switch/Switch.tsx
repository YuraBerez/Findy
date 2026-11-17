import type { ReactNode } from 'react'
import styles from './Switch.module.css'

interface VisualProps {
  checked: boolean
  /** Content of the moving knob (an icon) */
  thumb?: ReactNode
}

/** The look of a switch without its behaviour, e.g. inside a menu item that owns the role. */
export function SwitchVisual({ checked, thumb }: VisualProps) {
  return (
    <span className={styles.track} data-checked={checked || undefined} aria-hidden="true">
      <span className={styles.thumb}>{thumb}</span>
    </span>
  )
}

interface Props extends VisualProps {
  /** Accessible name; the state is aria-checked */
  label: string
  /** Tooltip, e.g. what a click does */
  title?: string
  disabled?: boolean
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
      className={styles.button}
      disabled={disabled}
      onClick={onToggle}
    >
      <SwitchVisual checked={checked} thumb={thumb} />
    </button>
  )
}
