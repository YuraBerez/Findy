import { useTranslation } from 'react-i18next'
import { STAGES, type StageId } from '@domain/stages'
import type { Application } from '@shared/ipc'
import { Menu, MoreIcon } from '@ui'
import styles from './CardActions.module.css'

interface Props {
  application: Application
  onMove(stage: StageId): void
}

/** Buttons in the card's top-right corner. They must never start a drag. */
export function CardActions({ application, onMove }: Props) {
  const { t } = useTranslation()
  return (
    <div
      className={styles.actions}
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {/* FR-021: move to any stage without drag-and-drop */}
      <Menu
        triggerLabel={t('card.actions', { title: application.title })}
        triggerIcon={<MoreIcon />}
        label={t('card.moveTo')}
        items={STAGES.filter((stage) => stage !== application.stage).map((stage) => ({
          key: stage,
          label: t(`stages.${stage}`),
          onSelect: () => onMove(stage),
        }))}
      />
    </div>
  )
}
