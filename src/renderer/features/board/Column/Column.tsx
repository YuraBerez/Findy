import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useTranslation } from 'react-i18next'
import type { Application, StageId } from '@shared/ipc'
import { SortableCard } from '../Card'
import { COLUMN_PREFIX } from '../dnd'
import type { MoveHandler } from '../useBoardDnd'
import styles from './Column.module.css'

interface Props {
  stage: StageId
  applications: Application[]
  onMove: MoveHandler
  /** Card to focus after it moved (it remounts in its new column) */
  focusId: string | null
  onFocused(): void
}

export function Column({ stage, applications, onMove, focusId, onFocused }: Props) {
  const { t } = useTranslation()
  // The whole column is a drop target, so empty columns accept cards too
  const { setNodeRef, isOver } = useDroppable({ id: COLUMN_PREFIX + stage })
  const headingId = `column-${stage}`
  return (
    <section
      ref={setNodeRef}
      className={styles.column}
      role="listitem"
      aria-labelledby={headingId}
      data-testid={`column-${stage}`}
      data-over={isOver || undefined}
    >
      <header className={styles.header}>
        <h2 id={headingId} className={styles.title} title={t(`stages.${stage}`)}>
          {t(`stages.${stage}`)}
        </h2>
        <span
          className={styles.count}
          aria-label={t('column.count', { count: applications.length })}
        >
          {applications.length}
        </span>
      </header>
      <SortableContext
        id={stage}
        items={applications.map((application) => application.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className={styles.cards}>
          {applications.map((application) => (
            <li key={application.id}>
              <SortableCard
                application={application}
                onMove={onMove}
                focus={focusId === application.id}
                onFocused={onFocused}
              />
            </li>
          ))}
        </ul>
      </SortableContext>
    </section>
  )
}
