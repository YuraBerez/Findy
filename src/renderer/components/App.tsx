import { useState } from 'react'
import type { AppState, Theme } from '../../shared/ipc'
import styles from './App.module.css'
import { StorageError } from './StorageError'
import { Toolbar } from './Toolbar'

export function App({ initialState }: { initialState: AppState }) {
  const [state, setState] = useState(initialState)

  const changeTheme = async (theme: Theme) => {
    // Optimistic: the switcher reacts at once, main confirms with the saved state
    setState((current) => ({ ...current, settings: { ...current.settings, theme } }))
    setState(await window.findy.setTheme(theme))
  }

  return (
    <div className={styles.app} data-testid="app">
      <Toolbar
        theme={state.settings.theme}
        onThemeChange={changeTheme}
        themeDisabled={state.storage.status !== 'ok'}
      />
      <main className={styles.content}>
        {state.storage.status === 'error' && <StorageError storage={state.storage} />}
      </main>
    </div>
  )
}
