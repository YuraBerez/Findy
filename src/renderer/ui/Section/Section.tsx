import { useId, type ReactNode } from 'react'
import styles from './Section.module.css'

interface Props {
  title: string
  /** Shown after the title, e.g. the number of items */
  count?: number
  /** Controls on the right of the heading, e.g. a view toggle */
  actions?: ReactNode
  children: ReactNode
}

/** A titled card that groups related content, e.g. in the details panel. */
export function Section({ title, count, actions, children }: Props) {
  const headingId = useId()
  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <div className={styles.header}>
        <h3 id={headingId} className={styles.heading}>
          {title}
          {count !== undefined && <span className={styles.count}>{count}</span>}
        </h3>
        {actions}
      </div>
      {children}
    </section>
  )
}
