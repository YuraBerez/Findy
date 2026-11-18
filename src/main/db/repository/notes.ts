import type { Note } from '../../../domain/types'
import type { ApplicationStore } from './applications'
import { NotFoundError } from './errors'
import { toNote, type NoteRow, type StoreContext } from './rows'

/** Notes of an application. Every change also bumps the application's `updatedAt`. */
export class NoteStore {
  constructor(
    private readonly ctx: StoreContext,
    private readonly applications: ApplicationStore,
  ) {}

  add(applicationId: string, text: string): Note {
    const { db } = this.ctx
    const id = this.ctx.newId()
    const at = this.ctx.now()
    db.transaction(() => {
      this.applications.require(applicationId)
      db.prepare(
        'INSERT INTO notes (id, application_id, text, created_at, updated_at) VALUES (?, ?, ?, ?, NULL)',
      ).run(id, applicationId, text, at)
      this.applications.touch(applicationId, at)
    })()
    return this.get(id)
  }

  update(applicationId: string, noteId: string, text: string): Note {
    const { db } = this.ctx
    const at = this.ctx.now()
    db.transaction(() => {
      this.require(applicationId, noteId)
      db.prepare('UPDATE notes SET text = ?, updated_at = ? WHERE id = ?').run(text, at, noteId)
      this.applications.touch(applicationId, at)
    })()
    return this.get(noteId)
  }

  delete(applicationId: string, noteId: string): void {
    const { db } = this.ctx
    db.transaction(() => {
      this.require(applicationId, noteId)
      db.prepare('DELETE FROM notes WHERE id = ?').run(noteId)
      this.applications.touch(applicationId, this.ctx.now())
    })()
  }

  private get(id: string): Note {
    return toNote(this.ctx.db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as NoteRow)
  }

  private require(applicationId: string, noteId: string): void {
    const row = this.ctx.db
      .prepare('SELECT id FROM notes WHERE id = ? AND application_id = ?')
      .get(noteId, applicationId)
    if (!row) throw new NotFoundError('Note', noteId)
  }
}
