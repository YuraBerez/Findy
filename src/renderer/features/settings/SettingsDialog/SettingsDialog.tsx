import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES } from '@domain/language'
import type { StageId } from '@domain/stages'
import type { Application, Language, McpConnection, Settings, Theme } from '@shared/ipc'
import { Dialog, Field, panelId, Select, Switch, tabId, Tabs } from '@ui'
import { McpSettings } from '../../assistant'
import { ExtensionSettings } from '../../extension'
import { StaleAfterField } from '../../stale'
import { ColumnSwitches } from '../ColumnSwitches'
import styles from './SettingsDialog.module.css'

// Each language is named in itself, so a user can find their own (spec 001 FR-040)
const NAMES: Record<Language, string> = { en: 'English', uk: 'Українська' }
const THEMES: readonly Theme[] = ['system', 'light', 'dark']

/** Spec 018 FR-001: the categories in the side list, in order */
// Spec 024 FR-001: the browser extension is the last category
const CATEGORIES = ['general', 'board', 'reminders', 'updates', 'assistant', 'extension'] as const
type Category = (typeof CATEGORIES)[number]

const ID_PREFIX = 'settings'

export interface SettingsActions {
  setLanguage(language: Language): void
  setTheme(theme: Theme): void
  setHiddenStages(stages: StageId[]): void
  /** Resolves to false when saving failed (already notified) */
  setStaleAfterDays(days: number): Promise<boolean>
  setRemindersEnabled(enabled: boolean): void
  setAutoUpdateCheck(enabled: boolean): void
  setMcpEnabled(enabled: boolean): void
  /** Spec 004 FR-009: null when it failed (already notified) */
  getMcpConnection(): Promise<McpConnection | null>
  /** Spec 016 FR-021 */
  saveSkill(): void
  /** Spec 016 FR-023 */
  openSkillInstall(): void
  /** Spec 024 FR-003: null when it failed (already notified) */
  getAppVersion(): Promise<string | null>
  /** Spec 024 FR-003, FR-004: an http(s) link in the system browser */
  openLink(url: string): void
}

interface Props {
  settings: Settings
  /** For the number of applications next to each column */
  applications: Application[]
  actions: SettingsActions
  onClose(): void
}

/**
 * Spec 018 FR-001: every setting in one window, with a side list of categories; a change
 * applies at once (FR-010).
 */
export function SettingsDialog({ settings, applications, actions, onClose }: Props) {
  const { t, i18n } = useTranslation()
  const [category, setCategory] = useState<Category>('general')
  const language = i18n.language as Language

  const toggle = (label: string, checked: boolean, onChange: (value: boolean) => void) => (
    <div className={styles.toggle}>
      <span>{label}</span>
      <Switch checked={checked} label={label} onToggle={() => onChange(!checked)} />
    </div>
  )

  const pages: Record<Category, ReactNode> = {
    general: (
      <>
        <Field label={t('language.label')}>
          {(control) => (
            <Select
              {...control}
              block
              value={language}
              onChange={(event) => actions.setLanguage(event.target.value as Language)}
            >
              {SUPPORTED_LANGUAGES.map((item) => (
                <option key={item} value={item} lang={item}>
                  {NAMES[item]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t('theme.label')}>
          {(control) => (
            <Select
              {...control}
              block
              value={settings.theme}
              onChange={(event) => actions.setTheme(event.target.value as Theme)}
            >
              {THEMES.map((theme) => (
                <option key={theme} value={theme}>
                  {t(`settings.themes.${theme}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </>
    ),
    board: (
      <>
        <p className={styles.hint}>{t('columns.hint')}</p>
        <ColumnSwitches
          hiddenStages={settings.hiddenStages}
          applications={applications}
          onChange={actions.setHiddenStages}
        />
        <div className={styles.stale}>
          <StaleAfterField days={settings.staleAfterDays} onSave={actions.setStaleAfterDays} />
        </div>
      </>
    ),
    reminders: (
      <>
        {toggle(t('reminders.menuItem'), settings.remindersEnabled, actions.setRemindersEnabled)}
        <p className={styles.hint}>{t('settings.remindersHint')}</p>
      </>
    ),
    updates: toggle(t('updates.menuAuto'), settings.autoUpdateCheck, actions.setAutoUpdateCheck),
    assistant: (
      <McpSettings
        enabled={settings.mcpEnabled}
        onChange={actions.setMcpEnabled}
        loadConnection={actions.getMcpConnection}
        onSaveSkill={actions.saveSkill}
        onOpenInstall={actions.openSkillInstall}
      />
    ),
    extension: (
      <ExtensionSettings loadVersion={actions.getAppVersion} onOpenLink={actions.openLink} />
    ),
  }

  return (
    <Dialog
      variant="wide"
      title={t('settings.title')}
      closeLabel={t('common.close')}
      onClose={onClose}
      testId="settings"
    >
      <nav className={styles.side}>
        <Tabs<Category>
          label={t('settings.categories')}
          orientation="vertical"
          items={CATEGORIES.map((key) => ({ key, label: t(`settings.${key}`) }))}
          value={category}
          onChange={setCategory}
          idPrefix={ID_PREFIX}
        />
      </nav>
      <div
        role="tabpanel"
        id={panelId(ID_PREFIX, category)}
        aria-labelledby={tabId(ID_PREFIX, category)}
        className={styles.panel}
      >
        <h3 className={styles.heading}>{t(`settings.${category}`)}</h3>
        {pages[category]}
      </div>
    </Dialog>
  )
}
