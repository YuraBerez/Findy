import { useTranslation } from 'react-i18next'
import type { Note } from '@shared/ipc'
import { Button, TextField } from '@ui'
import { NoteItem } from '../NoteItem'
import { useNoteDraft } from '../useNoteDraft'
import styles from './NotesPanel.module.css'

export interface NoteActions {
  add(text: string): Promise<void>
  update(noteId: string, text: string): Promise<void>
  remove(noteId: string): Promise<void>
}

interface Props {
  notes: Note[]
  actions: NoteActions
}

/** US-3: add, list (newest first), edit and delete notes of one application. */
export function NotesPanel({ notes, actions }: Props) {
  const { t } = useTranslation()
  const note = useNoteDraft('')

  return (
    <section className={styles.panel} aria-labelledby="notes-heading">
      <h3 id="notes-heading" className={styles.heading}>
        {t('notes.title')}
      </h3>
      <form
        noValidate
        onSubmit={note.submit(async (text) => {
          await actions.add(text)
          note.reset('')
        })}
      >
        <TextField
          multiline
          label={t('notes.new')}
          value={note.draft}
          error={note.error}
          onChange={(event) => note.change(event.target.value)}
        />
        <div className={styles.addRow}>
          <Button type="submit" variant="primary" size="small">
            {t('notes.add')}
          </Button>
        </div>
      </form>
      {notes.length === 0 ? (
        <p className={styles.empty}>{t('notes.empty')}</p>
      ) : (
        <ul className={styles.list} aria-label={t('notes.title')}>
          {notes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              onSave={(text) => actions.update(note.id, text)}
              onDelete={() => actions.remove(note.id)}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
