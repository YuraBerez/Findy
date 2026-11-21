import { useTranslation } from 'react-i18next'
import type { Application } from '@shared/ipc'
import { ColorSwatch, ExternalLinkIcon, IconButton, Menu, MoreIcon } from '@ui'
import { useColorOptions } from '../../colors'
import { useBoardActions } from '../BoardActions'
import styles from './CardActions.module.css'

/** Buttons in the card's top-right corner. They must never start a drag. */
export function CardActions({ application }: { application: Application }) {
  const { t } = useTranslation()
  const board = useBoardActions()
  const colors = useColorOptions()
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
      {/* FR-021: move to any stage without drag-and-drop; spec 007: the card colour */}
      <Menu
        triggerLabel={t('card.actions', { title: application.title })}
        triggerIcon={<MoreIcon />}
        label={t('card.actions', { title: application.title })}
        heading={t('card.moveTo')}
        items={[
          ...board.visible
            .filter((stage) => stage !== application.stage)
            .map((stage) => ({
              key: stage,
              label: t(`stages.${stage}`),
              onSelect: () => board.move(application.id, { stage, index: 0 }),
            })),
          { key: 'color-separator', separator: true },
          // Spec 015 FR-013
          {
            key: 'next-step',
            label: t('nextStep.menuItem'),
            onSelect: () => board.openStep(application.id),
          },
          {
            key: 'color',
            submenu: true,
            label: t('colors.title'),
            value: colors.name(application.color),
            backLabel: t('common.back'),
            options: colors.options.map((option) => ({
              key: option.key,
              label: option.label,
              icon: <ColorSwatch color={option.color} />,
              checked: option.key === colors.keyOf(application.color),
              onSelect: () => board.setColor(application.id, colors.colorOf(option.key)),
            })),
          },
        ]}
      />
    </div>
  )
}
