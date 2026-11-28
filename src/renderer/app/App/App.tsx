import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { lastCurrency } from '@domain/fields'
import { nextStatusChange } from '@domain/nextStep'
import type { AppState, ImportPreview, Language } from '@shared/ipc'
import { ConfirmDialog, panelId, tabId } from '@ui'
import { Analytics } from '../../features/analytics'
import { ApplicationDetails, ApplicationDialog } from '../../features/applications'
import { Board } from '../../features/board'
import { ReportIssueButton } from '../../features/feedback'
import { UpdateDialog, useUpdateCheck } from '../../features/updates'
import { SettingsDialog } from '../../features/settings'
import { Confetti, OfferDialog } from '../../features/support'
import { useNow } from '../../hooks/useNow'
import { ImportDialog } from '../../features/transfer'
import { StorageError } from '../../features/storage'
import { SitesView } from '../../features/sites'
import { SKILL_INSTALL_URL, SUPPORT_URL } from '@shared/project'
import { Toolbar } from '../Toolbar'
import { useNotifications } from '../notifications'
import { useAppState, useMainEvent } from '../useAppState'
import { useViewShortcuts, VIEW_ID_PREFIX, type View } from '../views'
import styles from './App.module.css'

export function App({ initialState }: { initialState: AppState }) {
  const { notifyError, notify } = useNotifications()
  const { state, siteIcons, storageReady, offerAsked, offerCount, actions } = useAppState(
    initialState,
    notifyError,
  )
  const [adding, setAdding] = useState(false)
  const [view, setView] = useState<View>('board')
  const [openId, setOpenId] = useState<string | null>(null)
  // Spec 015 FR-013: the details opened at the next step
  const [openAtStep, setOpenAtStep] = useState(false)
  const open = useCallback((id: string | null, atStep = false) => {
    setOpenId(id)
    setOpenAtStep(atStep)
  }, [])
  const [resetting, setResetting] = useState(false)
  const [editingSettings, setEditingSettings] = useState(false)
  const [importing, setImporting] = useState<ImportPreview | null>(null)
  const [query, setQuery] = useState('')
  // Spec 010 FR-004, spec 015 FR-023: marks follow the time without a restart
  const now = useNow(
    useCallback(
      (at: Date) =>
        nextStatusChange(
          state.applications.map((application) => application.nextStep),
          at,
        ),
      [state.applications],
    ),
  )
  // Spec 018 FR-002: Settings… in the native menu or Cmd/Ctrl+, (its accelerator)
  useMainEvent(
    'openSettings',
    useCallback(() => {
      // Nothing while another dialog or the details panel is open
      if (!document.querySelector('dialog[open]')) setEditingSettings(true)
    }, []),
  )
  // Spec 015 FR-035: a click on a step notification
  useMainEvent(
    'openApplication',
    useCallback(
      (id: unknown) => {
        if (typeof id !== 'string') return
        setView('board')
        open(id)
      },
      [open],
    ),
  )
  const { hiddenStages } = state.settings
  const { t, i18n } = useTranslation()
  const count = state.applications.length
  const { staleAfterDays } = state.settings
  const opened = state.applications.find((application) => application.id === openId)
  // Spec 006: the automatic check runs once the app can read its settings
  const updates = useUpdateCheck(storageReady, actions.checkForUpdates)
  // Edge case: a found update waits until no other dialog is open
  const dialogOpen = adding || editingSettings || resetting || Boolean(opened) || Boolean(importing)
  const startAdding = () => setAdding(true)
  // Spec 008: the file name and counts come back; a cancelled dialog gives null
  const exportCsv = async () => {
    const result = await actions.exportCsv(i18n.language as Language)
    if (result?.status === 'saved') notify(t('transfer.exported', { count: result.count }))
  }
  const importCsv = async () => setImporting(await actions.previewImport())
  const confirmImport = async (token: string) => {
    setImporting(null)
    const added = await actions.confirmImport(token)
    if (added !== null) notify(t('transfer.imported', { count: added }))
  }
  const showBoard = useCallback(() => setView('board'), [])
  useViewShortcuts(storageReady, setView)
  // FR-003: the board stays mounted under the analytics tab, so it keeps its state
  const panel = (key: View) => ({
    role: 'tabpanel',
    id: panelId(VIEW_ID_PREFIX, key),
    'aria-labelledby': tabId(VIEW_ID_PREFIX, key),
    hidden: view !== key,
    className: styles.panel,
  })

  return (
    <div className={styles.app} data-testid="app">
      <Toolbar
        storageReady={storageReady}
        onAdd={startAdding}
        applicationCount={count}
        onReset={() => setResetting(true)}
        onSettings={() => setEditingSettings(true)}
        query={query}
        onQueryChange={setQuery}
        onSupport={() => void actions.openLink(SUPPORT_URL)}
        view={view}
        onViewChange={setView}
        onCheckUpdates={() => void updates.checkNow()}
        onExport={() => void exportCsv()}
        onImport={() => void importCsv()}
      />
      <main className={styles.content}>
        {state.storage.status === 'error' ? (
          <StorageError storage={state.storage} />
        ) : (
          <>
            <div {...panel('board')}>
              <Board
                applications={state.applications}
                onAdd={startAdding}
                onMove={actions.moveApplication}
                onOpen={open}
                onOpenStep={(id) => open(id, true)}
                onOpenLink={actions.openLink}
                onColorChange={actions.setApplicationColor}
                hiddenStages={hiddenStages}
                onHide={(stage) => actions.setHiddenStages([...hiddenStages, stage])}
                query={query}
                staleAfterDays={staleAfterDays}
                now={now}
              />
            </div>
            <div {...panel('analytics')}>
              {view === 'analytics' && (
                <Analytics
                  applications={state.applications}
                  hiddenStages={hiddenStages}
                  view={state.settings.analytics}
                  onViewChange={actions.setAnalyticsView}
                  onShowBoard={showBoard}
                  onCopyImage={async (png) => {
                    if (await actions.copyImage(png)) notify(t('analytics.share.copied'))
                  }}
                  onSaveImage={async (png) => {
                    const result = await actions.saveImage(png)
                    if (result?.status === 'saved') notify(t('analytics.share.saved'))
                  }}
                />
              )}
            </div>
            <div {...panel('sites')}>
              {view === 'sites' && (
                <SitesView
                  sites={state.sites}
                  hiddenSites={state.settings.hiddenSites}
                  query={state.settings.siteQuery}
                  icons={siteIcons}
                  onQueryChange={(query) => void actions.setSiteQuery(query)}
                  onOpen={(url) => void actions.openLink(url)}
                  onAdd={actions.addSite}
                  onUpdate={actions.updateSite}
                  onDelete={(id) => void actions.deleteSite(id)}
                  onHiddenChange={(ids) => void actions.setHiddenSites(ids)}
                  onShown={() => void actions.refreshSiteIcons()}
                />
              )}
            </div>
          </>
        )}
      </main>
      {adding && (
        <ApplicationDialog
          hiddenStages={hiddenStages}
          onClose={() => setAdding(false)}
          onReadVacancy={actions.readVacancy}
          onSubmit={async (application) => {
            // Spec 003 US-2: on failure the dialog stays open with the input
            if (await actions.createApplication(application)) setAdding(false)
          }}
        />
      )}
      {editingSettings && (
        <SettingsDialog
          settings={state.settings}
          applications={state.applications}
          actions={{
            setLanguage: (language) => void actions.setLanguage(language),
            setTheme: (theme) => void actions.setTheme(theme),
            setHiddenStages: (stages) => void actions.setHiddenStages(stages),
            setStaleAfterDays: actions.setStaleAfterDays,
            setRemindersEnabled: (enabled) => void actions.setRemindersEnabled(enabled),
            setAutoUpdateCheck: (enabled) => void actions.setAutoUpdateCheck(enabled),
            setMcpEnabled: (enabled) => void actions.setMcpEnabled(enabled),
            getMcpConnection: actions.getMcpConnection,
            saveSkill: async () => {
              const result = await actions.saveSkill()
              if (result?.status === 'saved') notify(t('mcp.skillSaved'))
            },
            openSkillInstall: () => void actions.openLink(SKILL_INSTALL_URL),
            getAppVersion: actions.getAppVersion,
            openLink: (url) => void actions.openLink(url),
          }}
          onClose={() => setEditingSettings(false)}
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
            open(null)
            await actions.resetBoard()
          }}
        />
      )}
      {opened && (
        <ApplicationDetails
          key={opened.id}
          application={opened}
          onClose={() => open(null)}
          onSave={(changes) => actions.updateApplication(opened.id, changes)}
          onDelete={async () => {
            open(null)
            await actions.deleteApplication(opened.id)
          }}
          onOpenLink={actions.openLink}
          onColorChange={(color) => actions.setApplicationColor(opened.id, color)}
          onDeleteStageChange={(index) => actions.deleteStageChange(opened, index)}
          hiddenStages={hiddenStages}
          sites={state.sites}
          defaultCurrency={lastCurrency(state.applications)}
          nextStep={{
            now,
            focus: openAtStep,
            save: (step) => actions.setNextStep(opened.id, step),
            remove: () => void actions.setNextStep(opened.id, null),
            done: () => void actions.completeNextStep(opened.id),
            addToCalendar: async () => {
              const result = await actions.saveNextStepCalendar(opened.id)
              if (result?.status === 'saved') notify(t('nextStep.calendarSaved'))
            },
          }}
          notes={{
            add: (text) => actions.addNote(opened.id, text),
            update: (noteId, text) => actions.updateNote(opened.id, noteId, text),
            remove: (noteId) => actions.deleteNote(opened.id, noteId),
          }}
        />
      )}
      {importing && (
        <ImportDialog
          preview={importing}
          onConfirm={(token) => void confirmImport(token)}
          onClose={() => setImporting(null)}
        />
      )}
      {offerAsked && !dialogOpen && (
        // Spec 013: after a move to Offer; waits for the details panel (plan D-3)
        <OfferDialog
          onAnswer={actions.answerOfferQuestion}
          onOpenLink={(url) => void actions.openLink(url)}
          onClose={actions.closeOfferQuestion}
        />
      )}
      {updates.result && !dialogOpen && !offerAsked && (
        <UpdateDialog
          result={updates.result}
          onClose={updates.dismiss}
          onDownload={(url) => {
            updates.dismiss()
            void actions.openLink(url)
          }}
        />
      )}
      <ReportIssueButton onOpenLink={actions.openLink} />
      {/* Spec 013 FR-010: a new key plays it again for the next offer */}
      {offerCount > 0 && <Confetti key={offerCount} />}
    </div>
  )
}
