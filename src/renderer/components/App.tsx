import { useState } from 'react'
import type { ValidApplication } from '../../domain/forms'
import type { AppState, Theme } from '../../shared/ipc'
import styles from './App.module.css'
import { ApplicationDialog } from './ApplicationDialog'
import { Board } from './Board'
import { StorageError } from './StorageError'
import { Toolbar } from './Toolbar'

export function App({ initialState }: { initialState: AppState }) {
  const [state, setState] = useState(initialState)
  const [adding, setAdding] = useState(false)
  const storageReady = state.storage.status === 'ok'

  const changeTheme = async (theme: Theme) => setState(await window.findy.setTheme(theme))

  const create = async (application: ValidApplication) => {
    setState(await window.findy.createApplication(application))
    setAdding(false)
  }

  return (
    <div className={styles.app} data-testid="app">
      <Toolbar
        storageReady={storageReady}
        onAdd={() => setAdding(true)}
        onThemeChange={changeTheme}
      />
      <main className={styles.content}>
        {state.storage.status === 'error' ? (
          <StorageError storage={state.storage} />
        ) : (
          <Board applications={state.applications} onAdd={() => setAdding(true)} />
        )}
      </main>
      <ApplicationDialog open={adding} onClose={() => setAdding(false)} onSubmit={create} />
    </div>
  )
}
