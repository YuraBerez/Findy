import { useTranslation } from 'react-i18next'
import { enteredStageAt } from '../../domain/time'
import type { Application } from '../../shared/ipc'
import { formatDateTime, formatSince } from '../format'
import styles from './Card.module.css'

/** FR-003: title, company, note count, time in the current stage. */
export function Card({ application }: { application: Application }) {
  const { t, i18n } = useTranslation()
  const since = enteredStageAt(application)
  return (
    <article className={styles.card} data-testid="card" tabIndex={0}>
      <h3 className={styles.title} title={application.title}>
        {application.title}
      </h3>
      <p className={styles.company} title={application.company}>
        {application.company}
      </p>
      <footer className={styles.meta}>
        <span>{t('card.notes', { count: application.notes.length })}</span>
        <time
          dateTime={since}
          title={t('card.inStage', { date: formatDateTime(since, i18n.language) })}
        >
          {formatSince(since, i18n.language)}
        </time>
      </footer>
    </article>
  )
}
