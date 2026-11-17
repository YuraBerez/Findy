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

  const moveApplication = async (id: string, target: { stage: StageId; index: number }) => {
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
  }

  return {
    state,
    storageReady: state.storage.status === 'ok',
    actions: {
      createApplication: (application: ValidApplication) =>
        save(window.findy.createApplication(application)),

      /** FR-012: fields, then the stage if it changed (to the top of that column) */
      updateApplication: async (id: string, { stage, ...fields }: ValidApplication) => {
        await save(window.findy.updateApplication(id, fields))
        const current = state.applications.find((application) => application.id === id)
        if (current && current.stage !== stage) await moveApplication(id, { stage, index: 0 })
      },

      deleteApplication: (id: string) => save(window.findy.deleteApplication(id)),
      moveApplication,

      addNote: (id: string, text: string) => save(window.findy.addNote(id, text)),
      updateNote: (id: string, noteId: string, text: string) =>
        save(window.findy.updateNote(id, noteId, text)),
      deleteNote: (id: string, noteId: string) => save(window.findy.deleteNote(id, noteId)),

      /** FR-015: main opens http(s) links in the system browser only */
      openLink: (url: string) => window.findy.openExternal(url),

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
