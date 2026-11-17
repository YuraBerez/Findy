import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { StageChange } from '@shared/ipc'
import { Button } from '@ui'
import { formatDateTime } from '../../../format'
import styles from './StageHistory.module.css'

const VISIBLE = 5

/** FR-024: stage changes as a timeline, newest first; long histories collapse. */
export function StageHistory({ history }: { history: StageChange[] }) {
  const { t, i18n } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const newestFirst = [...history].reverse()
  const shown = expanded ? newestFirst : newestFirst.slice(0, VISIBLE)

  return (
    <>
      <ol className={styles.timeline} aria-label={t('details.history')}>
        {shown.map((change, index) => (
          <li
            key={`${change.at}-${index}`}
            className={styles.item}
            data-current={index === 0 || undefined}
          >
            <span className={styles.stage}>{t(`stages.${change.stage}`)}</span>
            <time className={styles.time} dateTime={change.at}>
              {formatDateTime(change.at, i18n.language)}
            </time>
          </li>
        ))}
      </ol>
      {newestFirst.length > VISIBLE && (
        <Button
          size="small"
          variant="ghost"
          className={styles.toggle}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? t('details.showLess') : t('details.showAll', { count: newestFirst.length })}
        </Button>
      )}
    </>
  )
}
