import type { ComponentProps, ReactNode } from 'react'
import styles from './IconButton.module.css'

interface Props extends Omit<ComponentProps<'button'>, 'children'> {
  /** Accessible name: an icon button has no visible text */
  label: string
  icon: ReactNode
}

export function IconButton({ label, icon, className, type = 'button', ...props }: Props) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={[styles.iconButton, className].filter(Boolean).join(' ')}
      {...props}
    >
      {icon}
    </button>
  )
}
