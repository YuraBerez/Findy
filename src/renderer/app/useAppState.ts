import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { applyMove } from '@domain/board'
import type { ValidApplication } from '@domain/forms'
import {
  errorKind,
  type AnalyticsView,
  type AppState,
  type Language,
  type StageId,
  type Theme,
  type UpdateTrigger,
} from '@shared/ipc'

/**
 * The renderer's copy of the state and every action on it. Main owns the data
 * (architecture D-3): each action calls IPC and takes the state that main returns.
 *
 * Spec 003: every call goes through `run`. A failure is never silent: `onError`
 * shows it, the board reloads the saved state when it may be out of date, and the
 * action resolves to `false`, so a dialog can stay open with the user's input.
 */
export function useAppState(initial: AppState, onError: (error: unknown) => void) {
  const [state, setState] = useState(initial)
  const { i18n } = useTranslation()

  const refresh = async () => {
    try {
      setState(await window.findy.getState())
    } catch {
      // The notification for the first failure is already shown
    }
  }

  // Spec 004 FR-006: an AI assistant changed the board through MCP
  useEffect(() => window.findy.on('stateChanged', () => void refresh()), [])

  const run = async (call: () => Promise<AppState>): Promise<boolean> => {
    try {
      setState(await call())
      return true
    } catch (error) {
      onError(error)
      // FR-003: the optimistic view or a deleted item may not match main any more
      if (errorKind(error) !== 'validation') await refresh()
      return false
    }
  }

  /**
   * Spec 006: a failure of a manual check shows a notification (FR-009); an automatic
   * check never fails (FR-010).
   */
  const checkForUpdates = useCallback(
    async (trigger: UpdateTrigger) => {
      try {
        return await window.findy.checkForUpdates(trigger)
      } catch (error) {
        onError(error)
        return null
      }
    },
    [onError],
  )

  const moveApplication = (id: string, target: { stage: StageId; index: number }) => {
    // Optimistic: show the move at once, then take the saved state from main
    setState((current) => ({
      ...current,
      applications: applyMove(current.applications, id, target, new Date().toISOString()),
    }))
    return run(() => window.findy.moveApplication(id, target))
  }

  return {
    state,
    storageReady: state.storage.status === 'ok',
    actions: {
      createApplication: (application: ValidApplication) =>
        run(() => window.findy.createApplication(application)),

      /** FR-012: fields, then the stage if it changed (to the top of that column) */
      updateApplication: async (id: string, { stage, ...fields }: ValidApplication) => {
        if (!(await run(() => window.findy.updateApplication(id, fields)))) return false
        const current = state.applications.find((application) => application.id === id)
        return current && current.stage !== stage ? moveApplication(id, { stage, index: 0 }) : true
      },

      deleteApplication: (id: string) => run(() => window.findy.deleteApplication(id)),
      /** FR-090…093: main saves a backup, then deletes every application */
      resetBoard: () => run(() => window.findy.resetBoard()),
      moveApplication,

      addNote: (id: string, text: string) => run(() => window.findy.addNote(id, text)),
      updateNote: (id: string, noteId: string, text: string) =>
        run(() => window.findy.updateNote(id, noteId, text)),
      deleteNote: (id: string, noteId: string) => run(() => window.findy.deleteNote(id, noteId)),

      /** FR-015: main opens http(s) links in the system browser only */
      openLink: async (url: string) => {
        try {
          await window.findy.openExternal(url)
        } catch (error) {
          onError(error)
        }
      },

      setTheme: (theme: Theme) => run(() => window.findy.setTheme(theme)),

      checkForUpdates,
      /** Spec 006 FR-002 */
      setAutoUpdateCheck: (enabled: boolean) => run(() => window.findy.setAutoUpdateCheck(enabled)),

      /** Spec 004 FR-005 */
      setMcpEnabled: (enabled: boolean) => run(() => window.findy.setMcpEnabled(enabled)),

      /** Spec 002: optimistic, so the column disappears at once */
      setHiddenStages: (stages: StageId[]) => {
        setState((current) => ({
          ...current,
          settings: { ...current.settings, hiddenStages: stages },
        }))
        return run(() => window.findy.setHiddenStages(stages))
      },

      /** Spec 005 FR-032: optimistic, so the charts change at once */
      setAnalyticsView: (view: AnalyticsView) => {
        setState((current) => ({ ...current, settings: { ...current.settings, analytics: view } }))
        return run(() => window.findy.setAnalyticsView(view))
      },

      // FR-042: switch at once, then save the choice
      setLanguage: async (language: Language) => {
        await i18n.changeLanguage(language)
        document.documentElement.lang = language
        return run(() => window.findy.setLanguage(language))
      },
    },
  }
}
