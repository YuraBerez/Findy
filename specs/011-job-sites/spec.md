# Feature Spec: Job sites

- **ID:** 011-job-sites
- **Status:** Approved
- **Approved:** 2026-11-19 (owner)
- **Created:** 2026-11-19
- **Builds on:** [001-mvp-board](../001-mvp-board/spec.md) (FR-015 external links), [005-analytics](../005-analytics/spec.md) (tabs)
- **Needs:** a constitution amendment to §II (see D-6)

## Summary

A job seeker searches the same sites every day: Djinni, DOU, LinkedIn and others. Today
the user keeps these links outside Findy. A new "Sites" tab shows a list of known job
sites as tiles with their icons. The user types one search query, for example "QA
Engineer", and a click on a site opens that site's search results for the query in the
browser. The user can hide the known sites that they do not use and add their own
sites. Findy downloads each site's icon once and keeps it, so the tab works offline
after that.

## User stories

### US-1 — Open a job site with my search (P1)

As a job seeker, I want to open a job site's search for my query with one click, so
that I do not type the same search on every site.

**Acceptance scenarios**

1. **Given** the app, **When** I open the "Sites" tab (or press Ctrl+3 / Cmd+3), **Then**
   I see the known job sites in groups: Ukraine, International, Remote, Europe.
2. **Given** the query "QA Engineer", **When** I click Djinni, **Then** the system
   browser opens Djinni's search results for "QA Engineer".
3. **Given** an empty query, **When** I click a site, **Then** the browser opens the
   site's jobs page.
4. **When** I restart the app, **Then** the query is still there.
5. **Given** a query with spaces, Ukrainian letters, `&` or `#`, **Then** the site gets
   the query as typed (correctly encoded).

### US-2 — Add, edit and delete my own sites (P1)

As a user, I want to add sites that are not in the list, such as a company's careers
page or a local job board.

**Acceptance scenarios**

1. **When** I choose "Add site", enter the name "Acme careers" and the address
   `https://acme.com/careers?q={query}`, and save, **Then** the site appears in the
   group "My sites" and opens with my query in place of `{query}`.
2. **Given** an address without `{query}`, **Then** a click opens the address as is.
3. **When** I enter an address that is not `http`/`https`, or `{query}` in the host
   part, or an empty name, **Then** the form shows an error and does not save.
4. **When** I edit a site of mine, **Then** the tile shows the new name and address.
5. **When** I delete a site of mine, **Then** Findy asks first; after I confirm, the tile
   goes away.

### US-3 — Hide known sites (P2)

As a user, I want to hide the known sites that I do not use, so that the tab shows only
my sites.

**Acceptance scenarios**

1. **When** I hide LinkedIn, **Then** its tile goes away, also after a restart.
2. **Then** the tab shows "Show hidden sites (1)"; there I can show LinkedIn again.
3. Known sites cannot be edited or deleted, only hidden.

### US-4 — Site icons (P2)

As a user, I want to see each site's icon, so that I find a site at a glance.

**Acceptance scenarios**

1. **Given** the first opening of the tab with a network connection, **Then** each known
   site's icon is downloaded once and shown; later openings use the saved icons, also
   offline.
2. **When** I add a site of mine, **Then** its icon is downloaded once and shown.
3. **Given** no network, or a site without an icon, **Then** the tile shows the first
   letter of the site's name on a coloured circle instead; the tab works the same.
4. **When** I change the address of a site of mine to another host, **Then** its icon is
   downloaded again.

### US-5 — Keyboard and both languages (P1)

1. **Given** a keyboard only, **Then** I can reach the query field, every tile, "Add
   site", the actions of my sites and "Show hidden sites", and open a site with Enter.
2. **Given** the app in Ukrainian, **Then** the tab, the groups, the form and the
   messages are in Ukrainian. Site names are not translated.

## Functional requirements

### Tab and list

- **FR-001** The window MUST have a third tab, "Sites", after "Analytics", with the
  shortcut Ctrl+3 / Cmd+3 (spec 005 FR-002).
- **FR-002** Findy MUST include these known sites, in these groups and this order:
  - Ukraine: Djinni, DOU, Work.ua, robota.ua;
  - International: LinkedIn Jobs, Indeed, Glassdoor;
  - Remote: Wellfound, Remote OK, We Work Remotely;
  - Europe: Jooble, EuroJobs, StepStone, XING.
  For each one, Findy MUST know the address of its jobs page and, when the site has one,
  the address of its search results with a query. Wellfound, Remote OK and EuroJobs have
  no stable search address: they always open their jobs page (checked 2026-11-19).
- **FR-003** The user's sites MUST be in a group "My sites" after the known groups, in
  the order they were added. An empty group MUST NOT show.
- **FR-004** Each site MUST show as a tile with its icon (FR-020), its name and its host
  (for example `djinni.co`).

### Search query

- **FR-005** The tab MUST have one search query field. Its value MUST be saved and kept
  after a restart. It MUST be trimmed; at most 200 characters.
- **FR-006** A click on a tile, or Enter on it, MUST open the site in the system browser
  (spec 001 FR-015). With a non-empty query, it opens the site's search address with the
  query encoded for a URL; with an empty query, or for a known site without a search
  address, the jobs page (known sites) or the address without the query (the user's
  sites: `{query}` becomes empty).

### The user's sites

- **FR-010** "Add site" MUST open a form with a name (1–60 characters) and an address
  (an `http`/`https` URL, at most 2 048 characters). The address MAY contain `{query}`
  once, in the path, the query string or the fragment, not in the host.
- **FR-011** The user's sites MUST have "Edit" and "Delete" actions. Delete MUST ask for
  confirmation first.
- **FR-012** The user's sites, the hidden known sites and the query MUST be saved in the
  local database and kept after a restart. A reset of the board (spec 001 FR-090) MUST
  NOT change them.
- **FR-013** At most 50 sites of the user's own.

### Hidden known sites

- **FR-015** Each known site MUST have a "Hide" action. Hidden sites MUST NOT show in
  their group.
- **FR-016** When at least one known site is hidden, the tab MUST show "Show hidden
  sites ({count})". It lists the hidden sites with a "Show" action each.

### Icons

- **FR-020** Findy MUST show a site's saved icon when it has one, else the first letter
  of the site's name on a coloured circle. The circle's colour MUST be the same for the
  same name every time.
- **FR-021** Findy MUST download a known site's icon the first time the tab opens with no
  saved icon for it, and a user's site's icon when the site is added or its host
  changes. Each icon is downloaded once and saved; a failed download MUST be tried again
  on a later opening of the tab, at most once a day per site.
- **FR-022** An icon is taken from the site's home page (its declared icon), else from
  the standard icon address of the host. Only raster images (PNG, ICO, JPEG, GIF, WebP)
  MUST be accepted, at most 100 KB; SVG and anything else MUST be refused.
- **FR-023** Icon downloads MUST NOT block the tab: tiles show the letter until the icon
  arrives.

## Non-functional requirements

- **NFR-001** Privacy and security (constitution §II, §III): an icon download is a
  request to the site's own host only, with no cookies and no user data (not the query,
  not the list). It follows at most 5 redirects, only to `http`/`https`, and stops after
  5 seconds. Opening a site goes through the system browser only; the app window never
  loads a site.
- **NFR-002** Both languages, keyboard access and WCAG 2.1 AA, as in spec 001; the tiles
  fit the minimum window 800 × 600 (they wrap).
- **NFR-003** Automated tests MUST NOT reach real sites: icons come from local test
  servers, and opening a site is captured, not done.

## Edge cases

- A known site changes its search address in the future → a Findy update fixes it; the
  user can add the site as their own meanwhile.
- A known site is removed from the list in a later version → its hidden mark and saved
  icon are ignored.
- The user adds a site with the same address as a known one → allowed; both show.
- A query with `/` or `?` → encoded, so it stays one value.
- A saved icon is damaged → the letter shows; the icon is downloaded again later.
- The database cannot be opened (spec 001 US-6.3) → the tab shows the known sites with
  letters and no query; changes are not available.

## Out of scope

- Searching inside Findy, reading results, or adding applications from the results
  (spec 009 covers a single vacancy link).
- Several queries, query history, filters per site (location, salary, remote).
- Reordering sites by hand, renaming or editing known sites.
- Syncing the list between computers; the list in the CSV export or through MCP.
- Opening sites inside the app window.

## Success criteria

- **SC-001** A user opens the search for one query on three sites in under 10 seconds.
- **SC-002** After the first opening with a network connection, the tab shows the icons
  offline.

## Decisions

- **D-1** A separate tab "Sites" (owner, 2026-11-19).
- **D-2** One search query for all sites, saved; the user's sites can hold `{query}`
  (owner, 2026-11-19).
- **D-3** Known sites in four groups: Ukraine, International, Remote, Europe (owner,
  2026-11-19).
- **D-4** The user's sites: add, edit, delete; known sites: hide and show only (owner,
  2026-11-19).
- **D-5** Tiles with the site's icon (owner, 2026-11-19). No logos are stored in the
  repository: icons of known sites are downloaded like the user's ones (trademarks are
  not ours to distribute).
- **D-6** Icon downloads are a new exception to constitution §II.1/§II.3. It needs an
  amendment, §II.8, in a separate PR with the `constitution` label: "The app may
  download the icon of a job site in the Sites tab once and keep it locally. The
  request goes only to that site's host and sends no user data." (owner, 2026-11-19)
- **D-7** Defaults chosen without a question (change them before approval if needed):
  group order and site order of FR-002; the shortcut Ctrl+3; name 1–60 and query ≤ 200
  characters; at most 50 sites of the user's own; icon limits (raster only, 100 KB,
  5 s, retry once a day); letter circle colour from the name.

## Open questions

None.
