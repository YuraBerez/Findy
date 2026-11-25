import { randomUUID } from 'node:crypto'
import type { Database } from 'better-sqlite3'
import type { AnalyticsView } from '../../../domain/analytics'
import type { CardColor } from '../../../domain/colors'
import type { NextStep, StepRef } from '../../../domain/nextStep'
import type { CustomSite, KnownSiteId, SiteFormValues } from '../../../domain/sites'
import type {
  ApplicationInput,
  ApplicationPatch,
  MoveTarget,
  StageChangeRef,
} from '../../../domain/schema'
import type { StageId } from '../../../domain/stages'
import type { ImportedApplication } from '../../../domain/transfer'
import type { Application, Language, Note, Settings, Theme } from '../../../domain/types'
import { ApplicationStore } from './applications'
import { NoteStore } from './notes'
import { SettingsStore } from './settings'
import { SitesStore, type SiteIcon } from './sites'

export { HiddenStageError, NotFoundError, OnlyStageChangeError, SiteLimitError } from './errors'
export type { SiteIcon } from './sites'

export interface RepositoryOptions {
  now?: () => string
  newId?: () => string
}

/**
 * All reads and writes of user data. Every mutation runs in one transaction (FR-052).
 * Inputs are expected to be validated already (domain/schema.ts); the schema's CHECK
 * constraints are the last line of defence.
 *
 * One facade for IPC and MCP; the SQL lives in one store per table group.
 */
export class Repository {
  private readonly applications: ApplicationStore
  private readonly notes: NoteStore
  private readonly settings: SettingsStore
  private readonly sites: SitesStore

  constructor(db: Database, options: RepositoryOptions = {}) {
    const ctx = {
      db,
      now: options.now ?? (() => new Date().toISOString()),
      newId: options.newId ?? randomUUID,
    }
    this.settings = new SettingsStore(ctx)
    this.sites = new SitesStore(ctx)
    this.applications = new ApplicationStore(ctx, this.settings, this.sites)
    this.notes = new NoteStore(ctx, this.applications)
  }

  // ── Applications ─────────────────────────────────────────────────────────

  listApplications(): Application[] {
    return this.applications.list()
  }

  getApplication(id: string): Application {
    return this.applications.get(id)
  }

  createApplication(input: ApplicationInput): Application {
    return this.applications.create(input)
  }

  updateApplication(id: string, patch: ApplicationPatch): Application {
    return this.applications.update(id, patch)
  }

  setApplicationColor(id: string, color: CardColor | null): Application {
    return this.applications.setColor(id, color)
  }

  moveApplication(id: string, target: MoveTarget): Application {
    return this.applications.move(id, target)
  }

  /** Spec 021: deletes one stage history entry; the card follows the last one */
  deleteStageChange(id: string, entry: StageChangeRef): Application {
    return this.applications.deleteStageChange(id, entry)
  }

  /** Spec 015 FR-012: the step becomes the note `noteText(step)` */
  completeNextStep(id: string, noteText: (step: NextStep) => string): Application {
    return this.applications.completeNextStep(id, noteText)
  }

  /** Spec 015: the steps for the reminders */
  listNextSteps(): StepRef[] {
    return this.applications.listNextSteps()
  }

  deleteApplication(id: string): void {
    this.applications.delete(id)
  }

  /** Spec 008: adds every item in one transaction; returns the number added */
  importApplications(items: ImportedApplication[]): number {
    return this.applications.importMany(items)
  }

  resetBoard(): void {
    this.applications.deleteAll()
  }

  // ── Notes ────────────────────────────────────────────────────────────────

  addNote(applicationId: string, text: string): Note {
    return this.notes.add(applicationId, text)
  }

  updateNote(applicationId: string, noteId: string, text: string): Note {
    return this.notes.update(applicationId, noteId, text)
  }

  deleteNote(applicationId: string, noteId: string): void {
    this.notes.delete(applicationId, noteId)
  }

  // ── Job sites (spec 011) ─────────────────────────────────────────────────

  listSites(): CustomSite[] {
    return this.sites.list()
  }

  addSite(site: SiteFormValues): CustomSite {
    return this.sites.add(site)
  }

  updateSite(id: string, site: SiteFormValues): CustomSite {
    return this.sites.update(id, site)
  }

  deleteSite(id: string): void {
    this.sites.delete(id)
  }

  siteIcons(): SiteIcon[] {
    return this.sites.icons()
  }

  saveSiteIcon(host: string, mime: string, data: Uint8Array): void {
    this.sites.saveIcon(host, mime, data)
  }

  markSiteIconFailed(host: string): void {
    this.sites.markIconFailed(host)
  }

  setHiddenSites(ids: KnownSiteId[]): Settings {
    return this.settings.setHiddenSites(ids)
  }

  setSiteQuery(query: string): Settings {
    return this.settings.setSiteQuery(query)
  }

  // ── Settings ─────────────────────────────────────────────────────────────

  getSettings(): Settings {
    return this.settings.get()
  }

  setLanguage(language: Language): Settings {
    return this.settings.setLanguage(language)
  }

  setTheme(theme: Theme): Settings {
    return this.settings.setTheme(theme)
  }

  setMcpEnabled(enabled: boolean): Settings {
    return this.settings.setMcpEnabled(enabled)
  }

  setHiddenStages(stages: StageId[]): Settings {
    return this.settings.setHiddenStages(stages)
  }

  setAnalyticsView(view: AnalyticsView): Settings {
    return this.settings.setAnalyticsView(view)
  }

  /** Spec 010 FR-008 */
  setStaleAfterDays(days: number): Settings {
    return this.settings.setStaleAfterDays(days)
  }

  /** Spec 015 FR-030 */
  setRemindersEnabled(enabled: boolean): Settings {
    return this.settings.setRemindersEnabled(enabled)
  }

  setAutoUpdateCheck(enabled: boolean): Settings {
    return this.settings.setAutoUpdateCheck(enabled)
  }

  /** Spec 013 FR-004 */
  answerOfferQuestion(): Settings {
    return this.settings.answerOfferQuestion()
  }

  getLastUpdateCheck(): string | null {
    return this.settings.getLastUpdateCheck()
  }

  setLastUpdateCheck(at: string): void {
    this.settings.setLastUpdateCheck(at)
  }
}
