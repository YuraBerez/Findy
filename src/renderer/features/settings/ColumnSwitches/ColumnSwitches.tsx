import { useTranslation } from 'react-i18next'
import { STAGES, type StageId } from '@domain/stages'
import type { Application } from '@shared/ipc'
import { Switch } from '@ui'
import styles from './ColumnSwitches.module.css'

interface Props {
  hiddenStages: StageId[]
  applications: Application[]
  onChange(hidden: StageId[]): void
}

/** Spec 002 FR-002, spec 018 FR-012: show or hide each stage column; one always stays visible. */
export function ColumnSwitches({ hiddenStages, applications, onChange }: Props) {
  const { t } = useTranslation()
  const visibleCount = STAGES.length - hiddenStages.length

  return (
    <ul className={styles.list}>
      {STAGES.map((stage) => {
        const shown = !hiddenStages.includes(stage)
        const last = shown && visibleCount === 1
        const count = applications.filter((application) => application.stage === stage).length
        const name = t(`stages.${stage}`)
        return (
          <li key={stage} className={styles.row}>
            <span className={styles.name}>{name}</span>
            <span className={styles.count}>{t('column.count', { count })}</span>
            <Switch
              checked={shown}
              label={t('columns.show', { stage: name })}
              title={last ? t('columns.lastVisible') : undefined}
              disabled={last}
              onToggle={() =>
                onChange(
                  shown ? [...hiddenStages, stage] : hiddenStages.filter((item) => item !== stage),
                )
              }
            />
          </li>
        )
      })}
    </ul>
  )
}
