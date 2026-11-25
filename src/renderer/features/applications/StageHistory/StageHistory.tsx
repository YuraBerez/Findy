import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { removeStageChange } from '@domain/history'
import type { StageChange } from '@shared/ipc'
import { Button, ConfirmDialog, IconButton, TrashIcon } from '@ui'
import { formatDateTime } from '../../../format'
import styles from './StageHistory.module.css'

const VISIBLE = 5

interface Props {
  history: StageChange[]
  /** Spec 021: deletes the entry at this index of `history` (oldest first) */
  onDelete(index: number): Promise<boolean>
}

/**
 * FR-024: stage changes as a timeline, newest first; long histories collapse.
 * Spec 021: each entry can be deleted after a confirmation, except the only one.
 */
export function StageHistory({ history, onDelete }: Props) {
  const { t, i18n } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const list = useRef<HTMLOListElement>(null)
  const newestFirst = [...history].reverse()
  const shown = expanded ? newestFirst : newestFirst.slice(0, VISIBLE)
  const canDelete = history.length > 1
  const date = (at: string) => formatDateTime(at, i18n.language)
  const stage = (change: StageChange) => t(`stages.${change.stage}`)

  const confirmMessage = (index: number) => {
    const change = history[index]
    if (!change) return ''
    const values = { stage: stage(change), date: date(change.at) }
    const previous = removeStageChange(history, index)?.at(-1)
    return previous && previous.stage !== history.at(-1)?.stage
      ? t('details.historyDeleteMessageLast', { ...values, previous: stage(previous) })
      : t('details.historyDeleteMessage', values)
  }

  return (
    <>
      <ol ref={list} tabIndex={-1} className={styles.timeline} aria-label={t('details.history')}>
        {shown.map((change, position) => {
          const index = history.length - 1 - position
          return (
            <li
              key={`${change.at}-${index}`}
              className={styles.item}
              data-current={position === 0 || undefined}
            >
              <span className={styles.stage}>{stage(change)}</span>
              <time className={styles.time} dateTime={change.at}>
                {date(change.at)}
              </time>
              {canDelete && (
                <IconButton
                  className={styles.delete}
                  label={t('details.historyDelete', {
                    stage: stage(change),
                    date: date(change.at),
                  })}
                  icon={<TrashIcon size={14} />}
                  onClick={() => setDeleting(index)}
                />
              )}
            </li>
          )
        })}
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
      {deleting !== null && (
        <ConfirmDialog
          title={t('details.historyDeleteTitle')}
          message={confirmMessage(deleting)}
          confirmLabel={t('details.historyDeleteConfirm')}
          cancelLabel={t('form.cancel')}
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            setDeleting(null)
            await onDelete(deleting)
            // US-5.2: the row of the button can be gone
            list.current?.focus()
          }}
        />
      )}
    </>
  )
}
