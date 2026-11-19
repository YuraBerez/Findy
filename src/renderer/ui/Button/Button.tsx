import type { ComponentProps } from 'react'
import styles from './Button.module.css'

interface Props extends ComponentProps<'button'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'normal' | 'small'
}

export function Button({
  variant = 'secondary',
  size = 'normal',
  className,
  type = 'button',
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={[styles.button, styles[variant], size === 'small' && styles.small, className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  )
}
