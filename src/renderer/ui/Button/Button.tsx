import type { ComponentProps } from 'react'
import styles from './Button.module.css'

interface Props extends ComponentProps<'button'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'normal' | 'small'
  /** A toggle button: on or off (`aria-pressed`) */
  pressed?: boolean
}

export function Button({
  variant = 'secondary',
  size = 'normal',
  className,
  type = 'button',
  pressed,
  ...props
}: Props) {
  return (
    <button
      type={type}
      aria-pressed={pressed}
      className={[styles.button, styles[variant], size === 'small' && styles.small, className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  )
}
