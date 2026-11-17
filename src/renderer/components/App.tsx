import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { applyMove } from '../../domain/board'
import type { ValidApplication } from '../../domain/forms'
import type { AppState, Language, StageId, Theme } from '../../shared/ipc'
import styles from './App.module.css'
import { ApplicationDialog } from './ApplicationDialog'
import { Board } from './Board'
import { StorageError } from './StorageError'
import { Toolbar } from './Toolbar'

export function App({ initialState }: { initialState: AppState }) {
  const [state, setState] = useState(initialState)
  const [adding, setAdding] = useState(false)
  const storageReady = state.storage.status === 'ok'

  const { i18n } = useTranslation()

  const changeTheme = async (theme: Theme) => setState(await window.findy.setTheme(theme))

  // FR-042: switch at once, then save the choice
  const changeLanguage = async (language: Language) => {
    await i18n.changeLanguage(language)
    document.documentElement.lang = language
    setState(await window.findy.setLanguage(language))
  }

  const create = async (application: ValidApplication) => {
    setState(await window.findy.createApplication(application))
    setAdding(false)
  }

  const move = async (id: string, target: { stage: StageId; index: number }) => {
    // Optimistic: show the move at once, then take the saved state from main
    setState((current) => ({
      ...current,
      applications: applyMove(current.applications, id, target, new Date().toISOString()),
    }))
    try {
      setState(await window.findy.moveApplication(id, target))
    } catch {
      setState(await window.findy.getState())
    }
  }

  return (
    <div className={styles.app} data-testid="app">
      <Toolbar
        storageReady={storageReady}
        onAdd={() => setAdding(true)}
        onThemeChange={changeTheme}
        onLanguageChange={changeLanguage}
      />
      <main className={styles.content}>
        {state.storage.status === 'error' ? (
          <StorageError storage={state.storage} />
        ) : (
          <Board applications={state.applications} onAdd={() => setAdding(true)} onMove={move} />
        )}
      </main>
      <ApplicationDialog open={adding} onClose={() => setAdding(false)} onSubmit={create} />
    </div>
  )
}
