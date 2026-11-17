import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { applyMove } from '@domain/board'
import type { ValidApplication } from '@domain/forms'
import type { AppState, Language, StageId, Theme } from '@shared/ipc'

/**
 * The renderer's copy of the state and every action on it. Main owns the data
 * (architecture D-3): each action calls IPC and takes the state that main returns.
 */
export function useAppState(initial: AppState) {
  const [state, setState] = useState(initial)
  const { i18n } = useTranslation()

  const save = async (call: Promise<AppState>) => setState(await call)

  return {
    state,
    storageReady: state.storage.status === 'ok',
    actions: {
      createApplication: (application: ValidApplication) =>
        save(window.findy.createApplication(application)),

      moveApplication: async (id: string, target: { stage: StageId; index: number }) => {
        // Optimistic: show the move at once, then take the saved state from main
        setState((current) => ({
          ...current,
          applications: applyMove(current.applications, id, target, new Date().toISOString()),
        }))
        try {
          await save(window.findy.moveApplication(id, target))
        } catch {
          await save(window.findy.getState())
        }
      },

      setTheme: (theme: Theme) => save(window.findy.setTheme(theme)),

      // FR-042: switch at once, then save the choice
      setLanguage: async (language: Language) => {
        await i18n.changeLanguage(language)
        document.documentElement.lang = language
        await save(window.findy.setLanguage(language))
      },
    },
  }
}
