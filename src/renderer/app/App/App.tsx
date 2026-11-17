import { useState } from 'react'
import type { AppState } from '@shared/ipc'
import { ApplicationDetails, ApplicationDialog } from '../../features/applications'
import { Board } from '../../features/board'
import { StorageError } from '../../features/storage'
import { Toolbar } from '../Toolbar'
import { useAppState } from '../useAppState'
import styles from './App.module.css'

export function App({ initialState }: { initialState: AppState }) {
  const { state, storageReady, actions } = useAppState(initialState)
  const [adding, setAdding] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const opened = state.applications.find((application) => application.id === openId)
  const startAdding = () => setAdding(true)

  return (
    <div className={styles.app} data-testid="app">
      <Toolbar
        storageReady={storageReady}
        onAdd={startAdding}
        onThemeChange={actions.setTheme}
        onLanguageChange={actions.setLanguage}
      />
      <main className={styles.content}>
        {state.storage.status === 'error' ? (
          <StorageError storage={state.storage} />
        ) : (
          <Board
            applications={state.applications}
            onAdd={startAdding}
            onMove={actions.moveApplication}
            onOpen={setOpenId}
            onOpenLink={actions.openLink}
          />
        )}
      </main>
      {adding && (
        <ApplicationDialog
          onClose={() => setAdding(false)}
          onSubmit={async (application) => {
            await actions.createApplication(application)
            setAdding(false)
          }}
        />
      )}
      {opened && (
        <ApplicationDetails
          key={opened.id}
          application={opened}
          onClose={() => setOpenId(null)}
          onSave={(changes) => actions.updateApplication(opened.id, changes)}
          onDelete={async () => {
            setOpenId(null)
            await actions.deleteApplication(opened.id)
          }}
          onOpenLink={actions.openLink}
          notes={{
            add: (text) => actions.addNote(opened.id, text),
            update: (noteId, text) => actions.updateNote(opened.id, noteId, text),
            remove: (noteId) => actions.deleteNote(opened.id, noteId),
          }}
        />
      )}
    </div>
  )
}
