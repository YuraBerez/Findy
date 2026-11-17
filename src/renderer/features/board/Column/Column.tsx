import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useTranslation } from 'react-i18next'
import type { Application, StageId } from '@shared/ipc'
import { EyeOffIcon, IconButton } from '@ui'
import { useBoardActions } from '../BoardActions'
import { SortableCard } from '../Card'
import { COLUMN_PREFIX } from '../dnd'
import styles from './Column.module.css'

interface Props {
  stage: StageId
  applications: Application[]
}

export function Column({ stage, applications }: Props) {
  const { t } = useTranslation()
  const board = useBoardActions()
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
        {/* Spec 002 FR-001: the last visible column cannot be hidden */}
        {board.visible.length > 1 && (
          <IconButton
            label={t('column.hide', { stage: t(`stages.${stage}`) })}
            icon={<EyeOffIcon size={15} />}
            className={styles.hide}
            onClick={() => board.hide(stage)}
          />
        )}
      </header>
      <SortableContext
        id={stage}
        items={applications.map((application) => application.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className={styles.cards}>
          {applications.map((application) => (
            <li key={application.id}>
              <SortableCard application={application} />
            </li>
          ))}
        </ul>
      </SortableContext>
    </section>
  )
}
