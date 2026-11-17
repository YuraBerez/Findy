import { useTranslation } from 'react-i18next'
import type { Application, StageId } from '../../shared/ipc'
import { Card } from './Card'
import styles from './Column.module.css'

interface Props {
  stage: StageId
  applications: Application[]
}

export function Column({ stage, applications }: Props) {
  const { t } = useTranslation()
  const headingId = `column-${stage}`
  return (
    <section
      className={styles.column}
      role="listitem"
      aria-labelledby={headingId}
      data-testid={`column-${stage}`}
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
      <ul className={styles.cards}>
        {applications.map((application) => (
          <li key={application.id}>
            <Card application={application} />
          </li>
        ))}
      </ul>
    </section>
  )
}
