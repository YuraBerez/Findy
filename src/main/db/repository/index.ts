import { randomUUID } from 'node:crypto'
import type { Database } from 'better-sqlite3'
import type { AnalyticsView } from '../../../domain/analytics'
import type { ApplicationInput, ApplicationPatch, MoveTarget } from '../../../domain/schema'
import type { StageId } from '../../../domain/stages'
import type { Application, Language, Note, Settings, Theme } from '../../../domain/types'
import { ApplicationStore } from './applications'
import { NoteStore } from './notes'
import { SettingsStore } from './settings'

export { HiddenStageError, NotFoundError } from './errors'

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

  constructor(db: Database, options: RepositoryOptions = {}) {
    const ctx = {
      db,
      now: options.now ?? (() => new Date().toISOString()),
      newId: options.newId ?? randomUUID,
    }
    this.settings = new SettingsStore(ctx)
    this.applications = new ApplicationStore(ctx, this.settings)
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

  moveApplication(id: string, target: MoveTarget): Application {
    return this.applications.move(id, target)
  }

  deleteApplication(id: string): void {
    this.applications.delete(id)
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
}
