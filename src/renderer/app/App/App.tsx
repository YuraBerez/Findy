import { useState } from 'react'
import { ApplicationDialog } from '../../features/applications'
import { Board } from '../../features/board'
import { StorageError } from '../../features/storage'
import type { AppState } from '@shared/ipc'
import { Toolbar } from '../Toolbar'
import { useAppState } from '../useAppState'
import styles from './App.module.css'

export function App({ initialState }: { initialState: AppState }) {
  const { state, storageReady, actions } = useAppState(initialState)
  const [adding, setAdding] = useState(false)
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
    </div>
  )
}
