# Implementation Plan: Job sites

- **Spec:** [spec.md](spec.md) · **Architecture:** [docs/architecture.md](../../docs/architecture.md)
- **Status:** Approved

## Summary

The known sites are a constant list in `src/domain` with the jobs page address and an
optional search template of each site. The user's sites are a new table
(`job_sites`, migration 003); the hidden known sites and the query are settings rows.
Icons are a second new table (`site_icons`), keyed by host, filled by main. Main
downloads a missing icon when the tab asks for it or when a site is added. It reads
the home page for a declared icon, else `/favicon.ico`. It accepts only raster images
by their bytes, at most 100 KB in 5 s. The renderer gets icons as `data:` URLs through
one IPC call; the CSP already allows `img-src data:`. A tile opens its address in the
system browser through the existing `openExternal`.

## Technical context

| Item | Choice |
|------|--------|
| Language | TypeScript (strict) |
| Storage | Migration 003: `job_sites` (id, name, url, position, created_at), `site_icons` (host, mime, data BLOB, status, checked_at); settings rows `hiddenSites` (JSON) and `siteQuery` |
| Network | Node's `fetch` in main, as spec 009: the redirect and size rules move to one shared helper (`main/http.ts`) used by both |
| Images | Type sniffed from the first bytes (PNG, ICO, JPEG, GIF, WebP); SVG and other types refused |
| Testing | Vitest (URL building, template checks, icon discovery and sniffing, repository, migration, IPC, icon fetcher with fakes); e2e with a local icon server |
| Target platforms | Windows, macOS, Linux |

## Constitution check

| Principle | Complies? | Notes |
|-----------|-----------|-------|
| I. Spec first | ✅ | Spec 011, approved 2026-11-19 |
| II. Local-first | ✅ after §II.8 | Amendment §II.8 in #28, merged before this feature. Icons only from each site's own host, no user data; after the first download the tab works offline |
| III. Secure Electron | ✅ | Requests in main only; all new IPC input parsed with zod; sites open through `openExternal` (`http`/`https` only); the window never loads a site; icons are sniffed raster bytes shown as `data:` images (no SVG, no script) |
| IV. Cross-platform | ✅ | No platform code |
| V. i18n | ✅ | Tab, groups, form, actions, messages in en + uk; site names are not translated |
| VI. Tested | ✅ | Unit and e2e for every requirement; migration test on a v2 fixture |
| VII. Simplicity | ✅ | No new dependency; one shared fetch helper instead of two copies |
| VIII. Accessible | ✅ | Tiles are links with names; actions in a menu per tile; dialogs reuse `@ui`; Ctrl/Cmd+3 |

## Requirement → component map

| Requirements | Where |
|--------------|-------|
| FR-002 | `domain/sites/known.ts`: `KNOWN_SITES` (id, name, group, jobs page, search template, encoding: `component`, `plus` or `slug`) and `SITE_GROUPS` |
| FR-006 | `domain/sites/url.ts`: `siteUrl(site, query)`: fills `{query}` with the site's encoding; empty query → jobs page or the address without the query |
| FR-010, FR-013 | `domain/sites/validate.ts`: name 1–60, `http`/`https`, ≤ 2 048, `{query}` at most once and not in the host; `CustomSiteSchema` (zod) |
| FR-012 | Migration 003; `SitesStore` in `main/db/repository/` (add, update, delete, list, positions); settings `hiddenSites`, `siteQuery` |
| FR-021…FR-023, NFR-001 | `main/http.ts` (`fetchLimited`: manual redirects ≤ 5 on the same site, types, size, time; shared with `main/vacancy.ts`); `domain/sites/icons.ts` (`declaredIcon(html, base)`, `sniffImage(bytes)`); `main/siteIcons.ts` (`createIconFetcher`: missing or failed > 24 h, 4 at a time, saves, emits `siteIconsChanged`) |
| IPC | `addSite`, `updateSite`, `deleteSite`, `setHiddenSites`, `setSiteQuery` → `AppState`; `getSiteIcons()` → host → `data:` URL; `refreshSiteIcons()`; event `siteIconsChanged` |
| FR-001 | `app/views.ts`: third view `sites`, Ctrl/Cmd+3 |
| FR-003…FR-006, FR-015, FR-016, FR-020 | `features/sites/`: `SitesView` (query field, groups, tiles), `SiteTile` (icon or letter, name, host, menu: Hide / Edit / Delete), `HiddenSites` section, `SiteDialog` (add / edit), delete confirm through `@ui/ConfirmDialog`; letter colour from the name hash over the card colour tokens |
| NFR-003 | `FINDY_SITE_ICONS_URL` (ignored when packaged): icons come from `<base>/<host>/…` of a local server; e2e sets it to a closed port by default |

## IPC contract change

```ts
addSite(site: { name: string; url: string }): Promise<AppState>;
updateSite(id: string, site: { name: string; url: string }): Promise<AppState>;   // NOT_FOUND
deleteSite(id: string): Promise<AppState>;                                          // NOT_FOUND
setHiddenSites(ids: KnownSiteId[]): Promise<AppState>;
setSiteQuery(query: string): Promise<AppState>;                                     // ≤ 200
getSiteIcons(): Promise<Record<string, string>>;   // host → data: URL of the saved icon
refreshSiteIcons(): Promise<void>;                 // downloads missing ones in the background
// AppState.sites: CustomSite[]; Settings.hiddenSites: KnownSiteId[]; Settings.siteQuery: string
// event 'siteIconsChanged'
```

## Database change

```sql
-- 003-job-sites
CREATE TABLE job_sites (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 60),
  url        TEXT NOT NULL CHECK (length(url) BETWEEN 1 AND 2048),
  position   INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE site_icons (
  host       TEXT PRIMARY KEY,
  mime       TEXT,
  data       BLOB,
  status     TEXT NOT NULL CHECK (status IN ('ok', 'failed')),
  checked_at TEXT NOT NULL
);
```

Schema version 3. A reset of the board does not touch them (FR-012).

## Key decisions

### D-1 — Known sites as data, not code per site

- **Chosen:** each site is a jobs page plus an optional template with `{query}` and an
  encoding (`component`: `encodeURIComponent`; `plus`: spaces as `+`; `slug`: lower
  case, words joined by `-`).
- **Why:** one tested function builds every address; a site that changes its format is
  a one-line fix. Checked 2026-11-19: Djinni, DOU, LinkedIn and XING answer their
  search address; Work.ua, robota.ua, Indeed, Glassdoor, We Work Remotely, Jooble and
  StepStone block scripted requests (bot protection) and are opened by hand in the dev
  app during T030; Wellfound, Remote OK and EuroJobs have no stable search address.

### D-2 — Icons by host, in the database, sent as `data:` URLs

- **Options considered:** files in the user data folder with a custom protocol; icons in
  `AppState`; a separate IPC call.
- **Chosen:** a `site_icons` table and `getSiteIcons()`.
- **Why:** the data stays in the one database (backups and reset rules hold); the CSP
  already allows `data:` images; icons stay out of `AppState`, which every action
  returns.

### D-3 — One fetch helper for spec 009 and spec 011

- **Why:** both need manual redirects with checks, a type and size limit and a time
  limit. One helper with tests is safer than two copies (constitution §VII).
- **Redirects for icons:** only to the same site: the host or a host that differs only
  by `www.` or a subdomain of the same parent (`linkedin.com` → `www.linkedin.com`).

### D-4 — Type from the bytes

- **Why:** servers often send icons as `text/plain` or `application/octet-stream`. The
  first bytes say what the file is; SVG is text and is refused, so no image can carry a
  script.

## Risks

- **Search formats change** → one-line fix in `KNOWN_SITES`; the user can add their own
  site meanwhile.
- **Sites that block scripted requests also block icon downloads** → the letter shows
  (FR-020); a later attempt may work.
- **Large `getSiteIcons` answer** → at most 64 icons × 100 KB; in practice a few KB each.
