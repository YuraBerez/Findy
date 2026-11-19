import { SITE_LIMITS, type CustomSite, type SiteFormValues } from '../../../domain/sites'
import { NotFoundError, SiteLimitError } from './errors'
import type { StoreContext } from './rows'

interface SiteRow {
  id: string
  name: string
  url: string
}

/** A saved icon of a host, or the time of a failed try (spec 011 FR-021) */
export interface SiteIcon {
  host: string
  status: 'ok' | 'failed'
  mime: string | null
  data: Uint8Array | null
  checkedAt: string
}

interface IconRow {
  host: string
  status: 'ok' | 'failed'
  mime: string | null
  data: Buffer | null
  checked_at: string
}

/** Spec 011: the `job_sites` and `site_icons` tables. A board reset does not touch them. */
export class SitesStore {
  constructor(private readonly ctx: StoreContext) {}

  /** FR-003: in the order they were added */
  list(): CustomSite[] {
    return this.ctx.db
      .prepare('SELECT id, name, url FROM job_sites ORDER BY position, created_at')
      .all() as SiteRow[]
  }

  /** FR-010, FR-013: at most 50 */
  add(site: SiteFormValues): CustomSite {
    const { db, newId, now } = this.ctx
    return db.transaction(() => {
      const { count, last } = db
        .prepare('SELECT COUNT(*) AS count, MAX(position) AS last FROM job_sites')
        .get() as { count: number; last: number | null }
      if (count >= SITE_LIMITS.count) throw new SiteLimitError(SITE_LIMITS.count)
      const created = { id: newId(), name: site.name, url: site.url }
      db.prepare(
        'INSERT INTO job_sites (id, name, url, position, created_at) VALUES (?, ?, ?, ?, ?)',
      ).run(created.id, created.name, created.url, (last ?? -1) + 1, now())
      return created
    })()
  }

  update(id: string, site: SiteFormValues): CustomSite {
    const result = this.ctx.db
      .prepare('UPDATE job_sites SET name = ?, url = ? WHERE id = ?')
      .run(site.name, site.url, id)
    if (result.changes === 0) throw new NotFoundError('Site', id)
    return { id, name: site.name, url: site.url }
  }

  delete(id: string): void {
    const result = this.ctx.db.prepare('DELETE FROM job_sites WHERE id = ?').run(id)
    if (result.changes === 0) throw new NotFoundError('Site', id)
  }

  icons(): SiteIcon[] {
    const rows = this.ctx.db
      .prepare('SELECT host, status, mime, data, checked_at FROM site_icons')
      .all() as IconRow[]
    return rows.map((row) => ({
      host: row.host,
      status: row.status,
      mime: row.mime,
      data: row.data && new Uint8Array(row.data),
      checkedAt: row.checked_at,
    }))
  }

  saveIcon(host: string, mime: string, data: Uint8Array): void {
    this.upsertIcon(host, 'ok', mime, Buffer.from(data))
  }

  /** FR-021: tried again on a later opening of the tab, at most once a day */
  markIconFailed(host: string): void {
    this.upsertIcon(host, 'failed', null, null)
  }

  private upsertIcon(
    host: string,
    status: 'ok' | 'failed',
    mime: string | null,
    data: Buffer | null,
  ): void {
    this.ctx.db
      .prepare(
        `INSERT INTO site_icons (host, status, mime, data, checked_at) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(host) DO UPDATE SET status = excluded.status, mime = excluded.mime,
           data = excluded.data, checked_at = excluded.checked_at`,
      )
      .run(host, status, mime, data, this.ctx.now())
  }
}
