import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { applyMove } from '@domain/board'
import { asksAboutOffer, isMoveToOffer } from '@domain/offer'
import type { ApplicationFields } from '@domain/fields'
import type { ValidApplication } from '@domain/forms'
import {
  errorKind,
  type AnalyticsView,
  type AppState,
  type CardColor,
  type ExportResult,
  type SaveSkillResult,
  type ImportPreview,
  type KnownSiteId,
  type Language,
  type StageId,
  type Theme,
  type UpdateTrigger,
  type VacancyData,
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

  // Spec 011 FR-020: icons of the job sites, host → data: URL; reloaded when main saves one
  const [siteIcons, setSiteIcons] = useState<Record<string, string>>({})
  const loadSiteIcons = useCallback(async () => {
    try {
      setSiteIcons(await window.findy.getSiteIcons())
    } catch (error) {
      onError(error)
    }
  }, [onError])
  useEffect(() => window.findy.on('siteIconsChanged', () => void loadSiteIcons()), [loadSiteIcons])

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

  /** A call that does not return the state; a failure is notified and gives null */
  const attempt = async <T>(call: () => Promise<T>): Promise<T | null> => {
    try {
      return await call()
    } catch (error) {
      onError(error)
      return null
    }
  }

  // Spec 013: the offer dialog is open; only moves made here set it, never MCP or an import
  const [offerAsked, setOfferAsked] = useState(false)
  // FR-010: one more confetti for each confirmed move to Offer
  const [offerCount, setOfferCount] = useState(0)

  const moveApplication = async (id: string, target: { stage: StageId; index: number }) => {
    const from = state.applications.find((application) => application.id === id)?.stage
    const answered = state.settings.offerQuestionAnswered
    // Optimistic: show the move at once, then take the saved state from main
    setState((current) => ({
      ...current,
      applications: applyMove(current.applications, id, target, new Date().toISOString()),
    }))
    const moved = await run(() => window.findy.moveApplication(id, target))
    // FR-001: only after main saved the move
    if (moved && from && isMoveToOffer(from, target.stage)) setOfferCount((count) => count + 1)
    if (moved && from && asksAboutOffer(from, target.stage, answered)) setOfferAsked(true)
    return moved
  }

  return {
    state,
    siteIcons,
    storageReady: state.storage.status === 'ok',
    offerAsked,
    offerCount,
    actions: {
      createApplication: (application: ValidApplication) =>
        run(() => window.findy.createApplication(application)),

      /** FR-012: fields, then the stage if it changed (to the top of that column) */
      updateApplication: async (
        id: string,
        { stage, ...fields }: ValidApplication & Partial<ApplicationFields>,
      ) => {
        if (!(await run(() => window.findy.updateApplication(id, fields)))) return false
        const current = state.applications.find((application) => application.id === id)
        return current && current.stage !== stage ? moveApplication(id, { stage, index: 0 }) : true
      },

      /** Spec 007 FR-004 */
      setApplicationColor: (id: string, color: CardColor | null) =>
        run(() => window.findy.setApplicationColor(id, color)),

      deleteApplication: (id: string) => run(() => window.findy.deleteApplication(id)),
      /** Spec 008 */
      exportCsv: (language: Language): Promise<ExportResult | null> =>
        attempt(() => window.findy.exportCsv(language)),
      previewImport: (): Promise<ImportPreview | null> =>
        attempt(() => window.findy.previewImport()),
      /** Spec 008 FR-017: the number added, or null when it failed */
      confirmImport: async (token: string): Promise<number | null> => {
        const result = await attempt(() => window.findy.confirmImport(token))
        if (!result) {
          await refresh()
          return null
        }
        setState(result.state)
        return result.added
      },

      /** Spec 011 */
      addSite: (site: { name: string; url: string }) => run(() => window.findy.addSite(site)),
      updateSite: (id: string, site: { name: string; url: string }) =>
        run(() => window.findy.updateSite(id, site)),
      deleteSite: (id: string) => run(() => window.findy.deleteSite(id)),
      setHiddenSites: (ids: KnownSiteId[]) => run(() => window.findy.setHiddenSites(ids)),
      setSiteQuery: (query: string) => run(() => window.findy.setSiteQuery(query)),
      /** FR-021: the saved icons now, the missing ones when main has them */
      refreshSiteIcons: async () => {
        await loadSiteIcons()
        await attempt(() => window.findy.refreshSiteIcons())
      },

      /** Spec 013: Not now, or the dialog is done */
      closeOfferQuestion: () => setOfferAsked(false),
      /** Spec 013 FR-004: a final answer; the dialog stays open for its next step */
      answerOfferQuestion: () => run(() => window.findy.answerOfferQuestion()),

      /** Spec 010 FR-008 */
      setStaleAfterDays: (days: number) => run(() => window.findy.setStaleAfterDays(days)),

      /** Spec 009: null when the page gives nothing; a failure is notified and gives null */
      readVacancy: (url: string): Promise<VacancyData | null> =>
        attempt(() => window.findy.readVacancy(url)),

      /** FR-090…093: main saves a backup, then deletes every application */
      resetBoard: () => run(() => window.findy.resetBoard()),
      moveApplication,

      addNote: (id: string, text: string) => run(() => window.findy.addNote(id, text)),
      updateNote: (id: string, noteId: string, text: string) =>
        run(() => window.findy.updateNote(id, noteId, text)),
      deleteNote: (id: string, noteId: string) => run(() => window.findy.deleteNote(id, noteId)),

      /** Spec 016 FR-021: null when it failed (already notified) */
      saveSkill: (): Promise<SaveSkillResult | null> => attempt(() => window.findy.saveSkill()),

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
