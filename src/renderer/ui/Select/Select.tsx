import type { SelectHTMLAttributes } from 'react'
import styles from './Select.module.css'

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Stretch to the width of the container (forms) */
  block?: boolean
}

/** Native select with a themed chevron and room for it on the right. */
export function Select({ block = false, className, children, ...props }: Props) {
  return (
    <span className={[styles.wrapper, block && styles.block].filter(Boolean).join(' ')}>
      <select className={[styles.select, className].filter(Boolean).join(' ')} {...props}>
        {children}
      </select>
    </span>
  )
}
