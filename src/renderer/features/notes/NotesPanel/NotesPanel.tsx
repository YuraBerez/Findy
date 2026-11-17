import { useTranslation } from 'react-i18next'
import type { Note } from '@shared/ipc'
import { Button, Section, TextField } from '@ui'
import { NoteItem } from '../NoteItem'
import { useNoteDraft } from '../useNoteDraft'
import styles from './NotesPanel.module.css'

/** Each resolves to false when it failed (the failure is already notified) */
export interface NoteActions {
  add(text: string): Promise<boolean>
  update(noteId: string, text: string): Promise<boolean>
  remove(noteId: string): Promise<boolean>
}

interface Props {
  notes: Note[]
  actions: NoteActions
}

/** US-3: write a note, then the list (newest first) with edit and delete. */
export function NotesPanel({ notes, actions }: Props) {
  const { t } = useTranslation()
  const note = useNoteDraft('')

  return (
    <Section title={t('notes.title')} count={notes.length}>
      <form
        noValidate
        className={styles.composer}
        onSubmit={note.submit(async (text) => {
          // Keep the draft when saving failed
          if (await actions.add(text)) note.reset('')
        })}
      >
        {/* The section title says it already; the label stays for screen readers */}
        <TextField
          multiline
          hideLabel
          rows={2}
          label={t('notes.new')}
          placeholder={notes.length === 0 ? t('notes.empty') : t('notes.placeholder')}
          value={note.draft}
          error={note.error}
          onChange={(event) => note.change(event.target.value)}
        />
        <Button type="submit" variant="primary" size="small" className={styles.add}>
          {t('notes.add')}
        </Button>
      </form>
      {notes.length > 0 && (
        <ul className={styles.list} aria-label={t('notes.title')}>
          {notes.map((item) => (
            <NoteItem
              key={item.id}
              note={item}
              onSave={(text) => actions.update(item.id, text)}
              onDelete={() => actions.remove(item.id)}
            />
          ))}
        </ul>
      )}
    </Section>
  )
}
