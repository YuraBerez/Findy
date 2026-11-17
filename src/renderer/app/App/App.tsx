import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AppState } from '@shared/ipc'
import { ConfirmDialog } from '@ui'
import { ApplicationDetails, ApplicationDialog } from '../../features/applications'
import { McpDialog } from '../../features/assistant'
import { Board } from '../../features/board'
import { ReportIssueButton } from '../../features/feedback'
import { ColumnsDialog } from '../../features/settings'
import { StorageError } from '../../features/storage'
import { Toolbar } from '../Toolbar'
import { useNotifications } from '../notifications'
import { useAppState } from '../useAppState'
import styles from './App.module.css'

export function App({ initialState }: { initialState: AppState }) {
  const { notifyError } = useNotifications()
  const { state, storageReady, actions } = useAppState(initialState, notifyError)
  const [adding, setAdding] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)
  const [editingColumns, setEditingColumns] = useState(false)
  const [assistant, setAssistant] = useState(false)
  const [query, setQuery] = useState('')
  const { hiddenStages } = state.settings
  const { t } = useTranslation()
  const count = state.applications.length
  const opened = state.applications.find((application) => application.id === openId)
  const startAdding = () => setAdding(true)

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
      />
      <main className={styles.content}>
        {state.storage.status === 'error' ? (
          <StorageError storage={state.storage} />
        ) : (
          <Board
            applications={state.applications}
            onAdd={startAdding}
            onMove={actions.moveApplication}
            onOpen={setOpenId}
            onOpenLink={actions.openLink}
            hiddenStages={hiddenStages}
            onHide={(stage) => actions.setHiddenStages([...hiddenStages, stage])}
            query={query}
          />
        )}
      </main>
      {adding && (
        <ApplicationDialog
          hiddenStages={hiddenStages}
          onClose={() => setAdding(false)}
          onSubmit={async (application) => {
            // Spec 003 US-2: on failure the dialog stays open with the input
            if (await actions.createApplication(application)) setAdding(false)
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
          hiddenStages={hiddenStages}
          notes={{
            add: (text) => actions.addNote(opened.id, text),
            update: (noteId, text) => actions.updateNote(opened.id, noteId, text),
            remove: (noteId) => actions.deleteNote(opened.id, noteId),
          }}
        />
      )}
      <ReportIssueButton onOpenLink={actions.openLink} />
    </div>
  )
}
