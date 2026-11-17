import type { ReactNode } from 'react'
import styles from './Badge.module.css'

/** A short status label, e.g. the current stage. */
export function Badge({ children }: { children: ReactNode }) {
  return <span className={styles.badge}>{children}</span>
}
