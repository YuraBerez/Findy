import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AppState } from '@shared/ipc'
import { ConfirmDialog } from '@ui'
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
  const [resetting, setResetting] = useState(false)
  const { t } = useTranslation()
  const count = state.applications.length
  const opened = state.applications.find((application) => application.id === openId)
  const startAdding = () => setAdding(true)

  return (
    <div className={styles.app} data-testid="app">
      <Toolbar
        storageReady={storageReady}
        onAdd={startAdding}
        onThemeChange={actions.setTheme}
        onLanguageChange={actions.setLanguage}
        applicationCount={count}
        onReset={() => setResetting(true)}
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
      {resetting && (
        // FR-091: the count, and Cancel as the default action
        <ConfirmDialog
          title={t('reset.title')}
          message={t('reset.message', { count })}
          confirmLabel={t('reset.confirm')}
          cancelLabel={t('form.cancel')}
          onCancel={() => setResetting(false)}
          onConfirm={async () => {
            setResetting(false)
            setOpenId(null)
            await actions.resetBoard()
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
