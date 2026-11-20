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
      // React focuses an autoFocus button before a <dialog> opens, which is too early;
      // Dialog finds it by this attribute after showModal()
      data-autofocus={props.autoFocus || undefined}
      className={[styles.button, styles[variant], size === 'small' && styles.small, className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  )
}
