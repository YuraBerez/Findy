import { useTranslation } from 'react-i18next'
import { groupByStage } from '../../domain/board'
import { STAGES } from '../../domain/stages'
import type { Application } from '../../shared/ipc'
import styles from './Board.module.css'
import { Column } from './Column'

interface Props {
  applications: Application[]
  onAdd(): void
}

/** FR-001…004: one column per stage, scrolls horizontally. */
export function Board({ applications, onAdd }: Props) {
  const { t } = useTranslation()
  const columns = groupByStage(applications)

  return (
    <div className={styles.wrapper}>
      {applications.length === 0 && (
        <section className={styles.empty} data-testid="empty-board">
          <h2>{t('board.emptyTitle')}</h2>
          <p>{t('board.emptyHint')}</p>
          <button type="button" className="button button--primary" onClick={onAdd}>
            {t('toolbar.addApplication')}
          </button>
        </section>
      )}
      <div className={styles.board} role="list" aria-label={t('board.label')}>
        {STAGES.map((stage) => (
          <Column key={stage} stage={stage} applications={columns[stage]} />
        ))}
      </div>
    </div>
  )
}
