import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { lastCurrency } from '@domain/fields'
import type { AppState, ImportPreview, Language } from '@shared/ipc'
import { ConfirmDialog, panelId, tabId } from '@ui'
import { Analytics } from '../../features/analytics'
import { ApplicationDetails, ApplicationDialog } from '../../features/applications'
import { McpDialog } from '../../features/assistant'
import { Board } from '../../features/board'
import { ReportIssueButton } from '../../features/feedback'
import { UpdateDialog, useUpdateCheck } from '../../features/updates'
import { ColumnsDialog } from '../../features/settings'
import { StaleAfterDialog } from '../../features/stale'
import { Confetti, OfferDialog } from '../../features/support'
import { useNow } from '../../hooks/useNow'
import { ImportDialog } from '../../features/transfer'
import { StorageError } from '../../features/storage'
import { SitesView } from '../../features/sites'
import { SUPPORT_URL } from '@shared/project'
import { Toolbar } from '../Toolbar'
import { useNotifications } from '../notifications'
import { useAppState } from '../useAppState'
import { useViewShortcuts, VIEW_ID_PREFIX, type View } from '../views'
import styles from './App.module.css'

export function App({ initialState }: { initialState: AppState }) {
  const { notifyError, notify } = useNotifications()
  const { state, siteIcons, storageReady, offerAsked, offerCount, actions } = useAppState(
    initialState,
    notifyError,
  )
  const [adding, setAdding] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)
  const [editingColumns, setEditingColumns] = useState(false)
  const [assistant, setAssistant] = useState(false)
  const [importing, setImporting] = useState<ImportPreview | null>(null)
  const [query, setQuery] = useState('')
  const [editingStale, setEditingStale] = useState(false)
  // Spec 010 FR-004: marks follow the time without a restart
  const now = useNow()
  const [view, setView] = useState<View>('board')
  const { hiddenStages } = state.settings
  const { t, i18n } = useTranslation()
  const count = state.applications.length
  const { staleAfterDays } = state.settings
  const opened = state.applications.find((application) => application.id === openId)
  // Spec 006: the automatic check runs once the app can read its settings
  const updates = useUpdateCheck(storageReady, actions.checkForUpdates)
  // Edge case: a found update waits until no other dialog is open
  const dialogOpen =
    adding ||
    assistant ||
    editingColumns ||
    editingStale ||
    resetting ||
    Boolean(opened) ||
    Boolean(importing)
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
        onThemeChange={actions.setTheme}
        onLanguageChange={actions.setLanguage}
        applicationCount={count}
        onReset={() => setResetting(true)}
        onColumns={() => setEditingColumns(true)}
        onAssistant={() => setAssistant(true)}
        query={query}
        onQueryChange={setQuery}
        onStaleAfter={() => setEditingStale(true)}
        onSupport={() => void actions.openLink(SUPPORT_URL)}
        view={view}
        onViewChange={setView}
        autoUpdateCheck={state.settings.autoUpdateCheck}
        onCheckUpdates={() => void updates.checkNow()}
        onAutoUpdateCheckChange={actions.setAutoUpdateCheck}
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
                onOpen={setOpenId}
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
      {editingStale && (
        <StaleAfterDialog
          days={staleAfterDays}
          onClose={() => setEditingStale(false)}
          onSave={async (days) => {
            if (await actions.setStaleAfterDays(days)) setEditingStale(false)
          }}
        />
      )}
      {assistant && (
        <McpDialog
          enabled={state.settings.mcpEnabled}
          onChange={actions.setMcpEnabled}
          onClose={() => setAssistant(false)}
        />
      )}
      {editingColumns && (
        <ColumnsDialog
          hiddenStages={hiddenStages}
          applications={state.applications}
          onChange={actions.setHiddenStages}
          onClose={() => setEditingColumns(false)}
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
          onColorChange={(color) => actions.setApplicationColor(opened.id, color)}
          hiddenStages={hiddenStages}
          sites={state.sites}
          defaultCurrency={lastCurrency(state.applications)}
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
