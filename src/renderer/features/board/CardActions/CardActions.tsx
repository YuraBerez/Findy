import { useTranslation } from 'react-i18next'
import { STAGES } from '@domain/stages'
import type { Application } from '@shared/ipc'
import { ExternalLinkIcon, IconButton, Menu, MoreIcon } from '@ui'
import { useBoardActions } from '../BoardActions'
import styles from './CardActions.module.css'

/** Buttons in the card's top-right corner. They must never start a drag. */
export function CardActions({ application }: { application: Application }) {
  const { t } = useTranslation()
  const board = useBoardActions()
  const { url } = application
  return (
    <div
      className={styles.actions}
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {/* FR-016: open the vacancy in the system browser */}
      {url && (
        <IconButton
          label={t('card.openVacancy', { title: application.title })}
          icon={<ExternalLinkIcon size={15} />}
          onClick={() => board.openLink(url)}
        />
      )}
      {/* FR-021: move to any stage without drag-and-drop */}
      <Menu
        triggerLabel={t('card.actions', { title: application.title })}
        triggerIcon={<MoreIcon />}
        label={t('card.moveTo')}
        items={STAGES.filter((stage) => stage !== application.stage).map((stage) => ({
          key: stage,
          label: t(`stages.${stage}`),
          onSelect: () => board.move(application.id, { stage, index: 0 }),
        }))}
      />
    </div>
  )
}
