import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Note } from '@shared/ipc'
import { Button, ConfirmDialog, IconButton, PencilIcon, TextField, TrashIcon } from '@ui'
import { formatDateTime } from '../../../format'
import { useNoteDraft } from '../useNoteDraft'
import styles from './NoteItem.module.css'

interface Props {
  note: Note
  onSave(text: string): Promise<void>
  onDelete(): Promise<void>
}

/** One note: text with line breaks, date, "edited" marker; edit and delete (FR-031…033). */
export function NoteItem({ note, onSave, onDelete }: Props) {
  const { t, i18n } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const edit = useNoteDraft(note.text)

  return (
    <li className={styles.note} data-testid="note">
      {editing ? (
        <form
          noValidate
          onSubmit={edit.submit(async (text) => {
            await onSave(text)
            setEditing(false)
          })}
        >
          <TextField
            multiline
            autoFocus
            label={t('notes.editLabel')}
            value={edit.draft}
            error={edit.error}
            onChange={(event) => edit.change(event.target.value)}
          />
          <div className={styles.actions}>
            <Button size="small" onClick={() => setEditing(false)}>
              {t('notes.cancel')}
            </Button>
            <Button size="small" type="submit" variant="primary">
              {t('notes.save')}
            </Button>
          </div>
        </form>
      ) : (
        <>
          <p className={styles.text}>{note.text}</p>
          <div className={styles.meta}>
            <time dateTime={note.createdAt}>{formatDateTime(note.createdAt, i18n.language)}</time>
            {note.updatedAt && (
              <span title={formatDateTime(note.updatedAt, i18n.language)}>
                · {t('notes.edited')}
              </span>
            )}
            <span className={styles.spacer} />
            <IconButton
              label={t('notes.edit')}
              icon={<PencilIcon size={15} />}
              onClick={() => {
                edit.reset(note.text)
                setEditing(true)
              }}
            />
            <IconButton
              label={t('notes.delete')}
              icon={<TrashIcon size={15} />}
              onClick={() => setConfirming(true)}
            />
          </div>
        </>
      )}
      {confirming && (
        <ConfirmDialog
          title={t('notes.deleteTitle')}
          message={t('notes.deleteMessage')}
          confirmLabel={t('notes.delete')}
          cancelLabel={t('notes.cancel')}
          onCancel={() => setConfirming(false)}
          onConfirm={async () => {
            setConfirming(false)
            await onDelete()
          }}
        />
      )}
    </li>
  )
}
