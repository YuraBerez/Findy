# Architecture

Cross-cutting technical design of Findy. Feature specs in `specs/` describe
*what* to build; this document describes *how the app is built*. A change here
must be motivated by a spec and land in the same PR.

**Status:** Draft · **Introduced by:** [001-mvp-board](../specs/001-mvp-board/spec.md)

## Tech stack

| Area | Choice | Why |
|------|--------|-----|
| Runtime | **Electron** (latest stable) | Cross-platform desktop from one codebase |
| Language | **TypeScript** (strict) | Shared types across main / preload / renderer |
| Build tooling | **electron-vite** | Fast dev server + HMR for all three processes |
| UI | **React** | Large ecosystem, easy for contributors |
| Styling | CSS Modules + CSS variables | No runtime cost; light/dark via `prefers-color-scheme`, driven by `nativeTheme.themeSource` (follows the OS until the user flips the sun/moon toggle) |
| Drag & drop | **@dnd-kit** | Accessible (keyboard sensor), maintained |
| i18n | **i18next** + **react-i18next** | Interpolation, plurals (Ukrainian has 3 plural forms) |
| Validation | **zod** | One schema → TS types + runtime validation in main |
| Database | **SQLite** via **better-sqlite3** | Local embedded DB, transactions, migrations (see D-2) |
| Packaging | **electron-builder** | Win/mac/Linux targets from CI |
| Unit tests | **Vitest** + `@vitest/coverage-v8` | Native to Vite; coverage gate ≥ 80 % |
| E2E tests | **Playwright** (`_electron`) + [**playwright-e2e-kit**](https://github.com/YuraBerez/playwright-e2e-kit) | Drives the real built app; layered suite, error guard, axe audits (D-6) |
| Lint/format | ESLint + Prettier | |
| Package manager | npm | Zero extra tooling for contributors |

## Process model

```
┌──────────────────────────── Main process (Node) ────────────────────────────┐
│  app lifecycle · single-instance lock · native menu (localised)             │
│  ┌───────────────┐   ┌────────────────┐   ┌──────────────────────────────┐   │
│  │ IPC handlers  │──▶│ domain (pure)  │──▶│ db: SQLite (better-sqlite3)  │   │
│  │ zod-validated │   │ board/notes ops│   │ repositories, migrations     │   │
│  └──────▲────────┘   └────────────────┘   └──────────────────────────────┘   │
└─────────┼───────────────────────────────────────────────────────────────────┘
          │ ipcRenderer.invoke('findy:*')   (contracts/ipc.md)
┌─────────┴──────── Preload (sandboxed) ───────┐
│ contextBridge.exposeInMainWorld('findy', …)  │
└─────────▲────────────────────────────────────┘
          │ window.findy
┌─────────┴──────────────── Renderer (React, no Node) ────────────────────────┐
│ Board · Column · Card · ApplicationDialog · NotesPanel · Settings           │
│ state: last AppState from main (main is the single source of truth)         │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Rules**

- Main owns state and disk. The renderer never holds authoritative data; every
  mutation is an IPC call returning the new `AppState`.
- `src/domain` is pure TypeScript: no Electron, no React, no `fs`. It is shared
  by main (to apply changes) and renderer (for derived values such as
  "days in stage" and search filtering).
- Renderer may update optimistically for drag-and-drop, then reconcile with the
  returned state.
- Only `src/main/db` touches SQLite. Each IPC mutation = one transaction.

## Project structure

```
src/
├── domain/              # pure logic (no Electron, React or fs), shared by main and renderer
│   ├── types.ts         # entities (docs/data-model.md)
│   ├── schema.ts        # zod schemas for IPC input & entities (main only, see D-6)
│   ├── limits.ts        # zod-free limits and checks that the renderer can use (D-6)
│   ├── stages.ts        # STAGES constant, StageId
│   ├── board.ts         # validation + ordering rules for applications
│   ├── forms.ts         # field errors of the application form
│   ├── search.ts        # board search (spec 001, spec 014)
│   ├── time.ts          # elapsed time, stage entry
│   ├── language.ts      # SUPPORTED_LANGUAGES (en, uk, pl); saved language or the OS locale
│   ├── colors.ts        # spec 007: CARD_COLORS, CardColor
│   ├── stale.ts         # spec 010: stale applications
│   ├── offer.ts         # spec 013: moves to Offer, the one-time question
│   ├── fields/          # spec 014: salary, work format, source rules (zod-free)
│   ├── nextStep/        # spec 015: step rules, status, reminders, formats, calendar file
│   ├── csv.ts           # spec 008: CSV reader/writer, formula guard
│   ├── transfer/        # spec 008: applications ↔ CSV rows (export table, import plan)
│   ├── vacancy/         # spec 009: job title and company from a page, as text
│   ├── sites/           # spec 011: known job sites, search addresses, icon rules
│   ├── analytics.ts     # spec 005: periods, buckets, stage entries, funnel, totals; spec 022: days of search
│   └── updates.ts       # spec 006: SemVer compare, the 24-hour check rule
├── shared/
│   ├── ipc.ts           # FindyApi, AppState, channel names, IpcError
│   ├── i18n.ts          # one i18next setup for main and renderer
│   ├── skill.ts         # spec 017: the skill install command
│   ├── extension.ts     # spec 019: native host name, extension ids, store links;
│   │                    # spec 024: release file and guide links
│   └── project.ts       # every GitHub URL of the project (home, issues, releases, API)
├── main/
│   ├── index.ts         # entry: lifecycle, single instance, IPC registration, --mcp forward
│   ├── app/             # Electron glue (covered by e2e): window.ts, dialogs.ts,
│   │                    # notices.ts, services.ts (creates every service below)
│   ├── ipc.ts           # the IPC handlers (zod-validated)
│   ├── security.ts      # allowed navigation, external links and IPC senders
│   ├── paths.ts         # the data folder, also without Electron (MCP)
│   ├── db/
│   │   ├── connection.ts    # open findy.db, pragmas, integrity check
│   │   ├── migrate.ts       # PRAGMA user_version + backups
│   │   ├── migrations/      # 001-init.ts, … (append-only)
│   │   └── repository/      # index.ts: the Repository facade for IPC and MCP;
│   │                        # applications.ts, notes.ts, settings.ts, sites.ts: one store
│   │                        # each; rows.ts: table rows and mapping; errors.ts
│   ├── mcp/             # spec 004: cli.ts (Node-mode entry), server.ts, tools.ts
│   ├── connector/       # spec 019: cli.ts (Node-mode entry for the browser extension),
│   │                    # codec.ts, handler.ts, register/ (host manifests, launcher)
│   ├── watch.ts         # spec 004: changes from another process (PRAGMA data_version)
│   ├── updates.ts       # spec 006: latest release request, the update checker
│   ├── transfer.ts      # spec 008: CSV files through system dialogs, pending import
│   ├── http.ts          # specs 009, 011: fetch with checked redirects and limits
│   ├── vacancy.ts       # spec 009: read a vacancy page
│   ├── siteIcons.ts     # spec 011: download and keep the job site icons
│   ├── reminders.ts     # spec 015: the reminder scheduler (15 minutes and 1 minute before)
│   ├── calendar.ts      # spec 015: the .ics file through the save dialog
│   ├── image.ts         # spec 023: the analytics image to the clipboard or a file
│   ├── skill/           # spec 016: the skill archive (zip writer, save through the dialog)
│   ├── menu.ts          # installs the localised native menu
│   ├── menuTemplate.ts  # the menu items (unit-tested)
│   ├── i18n.ts          # main-process strings (menu, dialogs)
│   └── smoke.ts         # CI: a packaged build loads better-sqlite3
├── preload/
│   └── index.ts
├── extension/           # spec 019: the browser extension: manifest.json, icons/,
│                        # browser/ (tab, connector), popup/ (built by scripts/build-extension.mjs)
└── renderer/            # component architecture (D-7)
    ├── index.html, main.tsx, i18n.ts, format.ts
    ├── app/             # App, Toolbar, notifications, ErrorBoundary,
    │                    # useAppState (all IPC calls), views.ts (tabs)
    ├── features/        # one folder per feature, one folder per component
    │   ├── board/       # Board/, Column/, Card/, CardActions/, dnd.ts, useBoardDnd.ts
    │   ├── applications/# ApplicationDialog/, ApplicationDetails/, ApplicationFields/,
    │   │                # ApplicationExtraFields/, StageHistory/, form hooks
    │   ├── notes/       # NotesPanel/, NoteItem/, useNoteDraft
    │   ├── search/      # SearchBox/
    │   ├── analytics/   # Analytics/, AnalyticsFilters/, Totals/, ActivityChart/,
    │   │                # StagesChart/, Funnel/, ChartCard/ (spec 005); ShareImageButton/,
    │   │                # ShareImageDialog/, shareImage/ (canvas card, spec 023)
    │   ├── updates/     # UpdateDialog/, useUpdateCheck, useUpdatesMenu (spec 006)
    │   ├── colors/      # useColorOptions: card colour names and tokens (spec 007)
    │   ├── transfer/    # ImportDialog/, useTransferMenu: CSV export and import (spec 008)
    │   ├── stale/       # StaleAfterField/ (spec 010)
    │   ├── sites/       # SitesView/, SiteTile/, SiteDialog/, HiddenSites/ (spec 011)
    │   ├── support/     # OfferDialog/, Confetti/ (spec 013)
    │   ├── fields/      # useFieldLabels (spec 014)
    │   ├── nextStep/    # NextStepSection/, NextStepMark/, form and label hooks (spec 015)
    │   ├── assistant/   # McpSettings/ (specs 004, 016, 017)
    │   ├── settings/    # SettingsDialog/ (spec 018), ColumnSwitches/
    │   ├── extension/   # ExtensionSettings/: the browser extension page (spec 024)
    │   ├── feedback/    # ReportIssueButton/
    │   └── storage/     # StorageError/
    ├── hooks/           # hooks for more than one feature: useNow, useFieldErrorText
    ├── ui/              # design-system primitives: Button, IconButton, Field,
    │                    # TextField, Select, Dialog, ConfirmDialog, Menu, Switch, Tabs,
    │                    # Section, Badge, Toast, CodeBlock, BarChart, ChartLegend,
    │                    # DataTable, ColorSwatch, ColorPicker, icons, styles/
    └── styles/          # global.css: tokens and reset only
locales/
├── en.json              # single source for main + renderer strings
└── uk.json
tests/
└── unit/                # Vitest: domain, db, IPC, i18n key parity
e2e/                     # Playwright + playwright-e2e-kit (D-6)
├── specs/               # acceptance scenarios, phases in test.step()
├── steps/               # flows across screens; Electron a11y step
├── screens/             # page objects: private locators, verbs, verify…()
├── fixtures/app.ts      # one Electron app + isolated database per test
└── data/                # back door: seed and read through window.findy
skills/findy/SKILL.md    # spec 016: the skill for AI assistants (bundled into main)
build/                   # icons, entitlements for electron-builder
website/                 # spec 020: the website, a separate npm package (D-19)
├── src/lib/             # pure logic: system detection, release files, guide links
├── src/i18n/            # en.ts, uk.ts (site text, not in locales/)
├── src/components/, src/layouts/, src/pages/, src/styles/
└── tests/               # unit/, built/ (HTML in dist/), browser/ (axe, keyboard)
.github/workflows/       # ci.yml, release.yml, site.yml (website → GitHub Pages)
```

## Key decisions

### D-1 — Electron + React + electron-vite

- **Options:** Electron, Tauri, Neutralinojs.
- **Chosen:** Electron.
- **Why:** Required by the project brief; largest contributor pool; Playwright support.

### D-2 — Local SQLite database (better-sqlite3)

- **Options:** SQLite via `better-sqlite3`; SQLite via `node:sqlite` (built
  into Node); SQLite via WASM (`sql.js`); IndexedDB in renderer; JSON file.
- **Chosen:** SQLite via `better-sqlite3`, opened only in the main process.
- **Why:** A real local database: transactions make every change atomic,
  constraints and foreign keys protect data integrity, indexed queries scale far
  beyond MVP volumes, and migrations via `PRAGMA user_version` are simple.
  SQLite is an open format users can inspect with any tool (§II.4).
  `better-sqlite3` is mature, fast and synchronous (simple code in main).
  `node:sqlite` is still experimental; `sql.js` keeps the DB in memory and
  needs manual flushing; IndexedDB lives in the renderer and breaks D-3.
- **Cost:** native module. Since v13, `better-sqlite3` ships Node-API
  prebuilds for win/mac/linux × x64/arm64 inside the npm package; Node-API is
  ABI-stable, so the same binary works in Node (unit tests) and Electron
  without rebuilding. Therefore: its implicit `node-gyp rebuild` install script
  is denied in `package.json` → `allowScripts`, and electron-builder runs with
  `npmRebuild: false`. CI verifies every packaged build loads it
  (`npm run smoke:packaged`).
- **No ORM:** plain SQL in `db/repository/` keeps the dependency count low
  (§VII); revisit if queries become complex.

### D-3 — Main process is the single source of truth

- **Why:** One writer → no races; validation in one trusted place (§III.2).

### D-4 — Fixed stages in code

- **Why:** Spec 001 fixes the stages. Stored as ids so a future
  "custom stages" spec can migrate to user-defined stages.

### D-5 — Unsigned builds for MVP

- **Why:** Signing certificates cost money; decided in spec 001 (D-3).
  README documents how to open unsigned apps.

### D-6 — E2E suite on playwright-e2e-kit

- **Chosen:** the owner's [playwright-e2e-kit](https://github.com/YuraBerez/playwright-e2e-kit)
  (pinned git tag) for layers, ESLint layer rules, the error guard and axe audits.
- **Electron adapter** (`e2e/fixtures/app.ts`): no `baseURL` or browser project. Each test
  launches the built app with `FINDY_USER_DATA_DIR` set to a temp directory and gives the
  window's context to the kit's error guard. Screens extend `BaseComponent` (no routes).
- **Accessibility:** `e2e/steps/a11y.steps.ts` runs axe in legacy mode, because axe's default
  mode opens a new page and Electron cannot. Formatting and exclusions come from the kit.
- **Rule:** the renderer must not trigger CSP violations; zod stays out of the renderer
  (`domain/limits.ts`), because zod v4 probes `new Function()` on load. ESLint blocks `zod` and
  `domain/schema` in `src/renderer`.

### D-7 — Renderer: components in folders, primitives in `ui/`, no duplication

- **Layers** (imports go down only): `app/` → `features/*` → `hooks/` → `ui/`.
  `ui/` has no business logic, no IPC and no i18n keys: it takes text as props.
  `hooks/` holds hooks that more than one feature uses; it can use `@domain`, `@shared`
  and i18n, but not IPC, `app/` or `features/`.
  Features never import each other's internals, only a feature's `index.ts`.
- **One folder per component:** `Name/Name.tsx`, `Name.module.css`, `index.ts`
  (later its tests and stories too). Import a folder, not its files.
- **No duplication:** a control, dialog, menu, icon or style that a second place needs
  moves to `ui/` first. Form controls compose `ui/styles/control.module.css`;
  `Field` owns label/hint/error and their ARIA wiring for every control.
- **One place per concern:** `Dialog` opens native dialogs; `Menu` owns the menu-button
  keyboard pattern; `useAppState` owns all IPC calls; `features/board/dnd.ts` and
  `useBoardDnd` own drag-and-drop, `Board` only renders.
- **Aliases:** `@domain/*`, `@shared/*`, `@ui` (tsconfig.web.json + electron.vite.config.ts).
- **Enforced:** `eslint.config.mjs` checks the layers, the feature `index.ts` rule and the
  `window.findy` rule. It also keeps `src/domain` pure (no Electron, React, Node or
  database). If a rule blocks a correct import, change the rule and this section together.
- **Errors (spec 003):** every IPC call goes through `useAppState.run()`: a failure
  becomes a notification (`app/notifications`, message by error code), the board
  reloads the saved state, and the action resolves to `false`. Global `error` /
  `unhandledrejection` listeners and an `ErrorBoundary` catch the rest. Never
  call `window.findy` outside `app/useAppState.ts`. Main's events also go through it
  (`useMainEvent`). The only exception is `main.tsx`: it reads the first state and
  the system locale before React starts.

### D-8 — MCP server inside the app (spec 004)

- The MCP server is a second entry, `out/main/mcp.js` (`src/main/mcp/cli.ts`). The
  client starts Findy's own binary in **Node mode** (`ELECTRON_RUN_AS_NODE=1`)
  with that script: no Chromium, no window, no helper processes, and stdio that
  works on Windows (an Electron GUI process does not read stdin pipes reliably
  there). It never imports Electron; `main/paths.ts` computes the same data
  folder as `app.getPath('userData')`. Tools are served over **stdio only**.
- `Findy --mcp` forwards to the same Node-mode server with inherited stdio. The
  AppImage uses it, because its mount path changes on every start.
- The `RunAsNode` Electron fuse must stay on; packaging does not change fuses. Gated by the `mcpEnabled` setting, off by default
  (constitution §II.5).
- **One rule set:** tools use the same `Repository` and zod schemas as IPC; the
  hidden-stage rule lives in `Repository` (`HiddenStageError`).
- **Two processes, one database:** SQLite WAL + busy timeout; every tool call is
  one transaction. The open app polls `PRAGMA data_version` (`main/watch.ts`) and
  sends `findy:stateChanged`, so the window shows MCP changes within a second.
- In MCP mode stdout is the protocol: logs go to stderr.

### D-9 — Analytics in the renderer, charts without a library (spec 005)

- The numbers come from `domain/analytics.ts`, a pure function of the state that the
  renderer already has. No new IPC read and no SQL aggregates: one pass over 1 000
  applications takes a few milliseconds, and MCP changes update the charts for free.
- Charts are `ui/BarChart` (stacked bars in HTML and CSS) and CSS funnel bars. No chart
  library: smaller bundle, our colour tokens, our a11y rules (constitution §VII, §VIII).
- One tab stop per chart; the arrow keys move a cursor and an `aria-live` caption reads
  the value. Every chart can show its numbers as a table.
- The board stays mounted under the analytics tab (`hidden`), so it keeps its state.

### D-10 — Update check in main, off by default (spec 006)

- The only network request that Findy itself makes (constitution §II.6). Main calls
  the GitHub API `releases/latest` with `net.fetch`; the renderer CSP does not change.
- `createUpdateChecker` owns the rules: an automatic check runs at start only when it
  is on and 24 hours passed, and never fails; a manual check always runs and rejects
  with `NETWORK`. One request at a time.
- No updater library and no download: "Download" opens the release page in the
  browser. Auto-install needs code signing on macOS first (D-5).
- e2e sets `FINDY_RELEASES_URL` to a local fake server, and to a closed port when a
  test has no server, so tests never reach GitHub.

### D-11 — CSV files in main, logic in the domain (spec 008)

- The CSV reader/writer and the mapping to applications are pure (`domain/csv.ts`,
  `domain/transfer/`). No CSV library: one format, ~100 lines, fully tested (§VII).
- Main opens the system dialogs and reads or writes only the picked path
  (`main/transfer.ts`). The renderer never sees a path.
- Import has two steps: `previewImport` keeps the file text in main under a random
  token; `confirmImport` plans again against the current board (an MCP change in
  between is counted) and adds all rows in one transaction.
- Headers and stage and colour names come from the locale files; import accepts both
  languages and the ids.
- e2e answers the system dialogs by replacing `dialog.showSaveDialog` and
  `dialog.showOpenDialog` in main (`answerFileDialogs`).

### D-12 — Vacancy pages read in main, parsed in the domain (spec 009)

- The second network request that Findy itself makes (constitution §II.7): only when
  the user pastes a link or uses "Fill from link" in the add dialog.
- Main reads the page with Node's `fetch` (`main/vacancy.ts`): no cookie store,
  `redirect: 'manual'` with each `Location` checked (≤ 5, `http`/`https` only),
  HTML types only, 10 s and 2 MB limits. Electron's `fetch` cannot check redirects one
  by one. The renderer CSP does not change.
- `domain/vacancy/` finds the job title and the company as text, without a DOM or a
  library: job posting data (JSON-LD, microdata), the page title split without the
  site name, the main heading and an element marked as the company, then the site
  name. Each field takes the first source that has it. No site-specific rules.
- `readVacancy` resolves with `null` for every failed read: the dialog shows a short
  message, not an error notification.
- e2e serves test pages from a local server (`VacancyServer`) and pastes through the
  system clipboard, one worker at a time (`withClipboard`).

### D-13 — Job sites: data in the domain, icons by host in the database (spec 011)

- The known sites are a constant list (`domain/sites/known.ts`): a jobs page and an
  optional search template with `{query}` and an encoding (`component`, `plus`,
  `slug`). One function builds every address; a tile opens it through `openExternal`.
- The user's sites are the table `job_sites` (migration 003); hidden known sites and the
  query are settings rows.
- Icons (constitution §II.8) are downloaded by main (`main/siteIcons.ts`) with the
  shared `fetchLimited` (`main/http.ts`, also used by spec 009): the declared icon of the
  home page, else `/favicon.ico`; same site only; type from the bytes (no SVG);
  100 KB, 5 s; a failed host is tried again after 24 h. Saved by host in `site_icons`
  and sent to the renderer as `data:` URLs (`getSiteIcons`), so the CSP does not
  change and `AppState` stays small.
- e2e sets `FINDY_SITE_ICONS_URL` to a local server, or to a closed port, so tests
  never reach the sites.

### D-14 — Extra fields as columns, the source rule in the repository (spec 014)

- The fields are nullable columns of `applications` (migration 004), not a key-value table:
  they are fixed and each has a CHECK.
- `salary` and `source` are whole values in the domain: a patch replaces them or sets
  `null`. The rules across columns live in `domain/fields/` and zod, because `ADD COLUMN`
  cannot add a table CHECK.
- `ApplicationStore` fills in an empty source from the link with `sourceFromUrl` in
  `create`, `update` and `importMany`, so the app, CSV import and MCP share one rule.
- CSV and MCP read a source as text (`parseSourceText`): a known site or channel by id or
  name, else a custom name.

### D-15 — The skill for assistants is a bundled text file (spec 016)

- `skills/findy/SKILL.md` (Agent Skills format) is the only copy. Main imports it with
  Vite's `?raw`, so each build holds the skill of its version and saving needs no network
  and no resource path.
- `saveSkill` writes a zip of stored entries (`main/skill/zip.ts`, CRC-32 from `node:zlib`):
  `findy/SKILL.md` at the root, as an upload to Claude Desktop expects. No zip library.
- `tests/unit/skill.test.ts` compares the `### <tool>` headings under `## Tools` with
  `createTools`, so the skill cannot fall behind the MCP tools.
- Claude Code users install it with one command from the main branch
  (`shared/skill.ts#skillInstallCommand`, spec 017); the release has no skill archive.

### D-16 — Next step: columns, a reminder scheduler in main (spec 015)

- The step is three nullable columns of `applications` (migration 005): text, a local
  date `YYYY-MM-DD` and an optional local time `HH:MM`. Wall-clock values, not UTC, so a
  step at 15:00 stays at 15:00 in another time zone (spec D-6).
- `nextStep` is a whole value in the create and update patch, so MCP shares the rules.
  "Done" is its own call (`completeNextStep`): it clears the step and adds a note in one
  transaction, with the note text written by main in the UI language.
- `main/reminders.ts` shows the system notifications. It checks every 10 seconds (reminders 15 minutes and 1 minute before a step), after
  each IPC call, after an MCP change and when the computer wakes, because renderer timers
  slow down in a hidden window. Shown reminders are kept in memory for the run.
- The renderer clock (`hooks/useNow`) waits until the next moment a card mark changes
  (`nextStatusChange`), at most one hour.
- "Add to calendar" writes an iCalendar file with a floating local time
  (`domain/nextStep/calendar.ts`); no time zone rules, no network.

### D-17 — One settings window; the app menu holds actions (spec 018)

- `features/settings/SettingsDialog` is a wide `@ui/Dialog` with a vertical `@ui/Tabs`
  list of categories. Each category is a page; only the page scrolls, so the window keeps
  its size. The AI assistant page is `features/assistant/McpSettings`.
- Cmd/Ctrl+, is the accelerator of the native menu item **Settings…**: main sends the
  `openSettings` event, and the renderer opens the window unless another dialog is open.
- The ⋯ menu holds only actions. A new setting goes into a category, never into the menu.

### D-18 — Browser extension through native messaging (spec 019)

- The extension (`src/extension/`, Manifest V3, built into `out/extension/`) reads the
  HTML of the active tab only when the popup opens, and finds the job title and the
  company with `domain/vacancy`. It has no `fetch` and no access to all sites
  (constitution §II.9).
- The browser starts the **connector**: a third entry, `out/main/connector.js`, in Node
  mode, as the MCP server (D-8). One request per connection, length-prefixed JSON on
  stdio ([contracts/native-messaging.md](contracts/native-messaging.md)). It uses the
  same `Repository` and zod schemas; the open app shows its writes through `watch.ts`.
- A host manifest cannot set environment variables, so it points at a launcher in
  `userData/connector/` (`.sh`, or `.cmd` on Windows; the AppImage runs `--connector`).
- Every app start writes the launcher and a host manifest for each installed browser
  (files on macOS and Linux, `HKCU` keys on Windows), only when the content changes. The
  manifest accepts only the ids in `shared/extension.ts`: one Chromium build from the
  Chrome Web Store, one Firefox build from addons.mozilla.org.

### D-19 — The website is a separate package in `website/` (spec 020)

- A static Astro site, published to GitHub Pages at `SITE_URL`
  (`src/shared/project.ts`) by `.github/workflows/site.yml`. It has its own
  `package.json`, lockfile, ESLint, Vitest (80 % gate on `website/src/lib` and
  `website/src/i18n`) and Playwright checks. The root ESLint, Prettier and Vitest ignore
  `website/`, and the app's dependencies do not change.
- The website shares only files: `src/shared/project.ts` (every URL), `docs/guide/*.md`
  (the guide pages, no copy), `docs/screenshots/` and `assets/logo.svg`.
- The build reads the latest release from the GitHub API once and writes the download
  links into the HTML. The visitor's browser loads nothing from other sites; Astro writes a
  CSP with the hashes of the inline script and styles.
- Site text is in `website/src/i18n/`, not in `locales/`, because the app bundles
  `locales/*.json`.
- CI runs the website checks only when a PR changes `website/` or a file that the site
  shows ([release.md](release.md) → CI).

### D-20 — The analytics image is drawn in the renderer, shared by main (spec 023)

- The renderer draws the card on a 1080 × 1080 canvas (`features/analytics/shareImage/`)
  from the same `analytics()` data and translations as the screen. No image or chart
  library and no hidden window.
- The image is always light: `shareImage/palette.ts` keeps the light token values, and a
  unit test compares them with `styles/global.css`, so the colours have one source.
- Text fits by measure on the real canvas (`fitFontSize`, `fitLines`), because the system
  font differs by platform.
- `copyImage` and `saveImage` send only PNG bytes to main (zod: a `Uint8Array` of at most
  5 MB with the PNG signature). Main writes the clipboard with Electron's `clipboard.write`
  and saves only to the path of the system save dialog (`main/image.ts`).
- The preview is a `data:` image with a hidden text alternative of every number; e2e
  checks the numbers there and reads the copied PNG back from the clipboard.

## Cross-cutting docs

- [constitution.md](constitution.md) — project principles
- [data-model.md](data-model.md) — entities and invariants
- [contracts/ipc.md](contracts/ipc.md) — renderer ↔ main API
- [contracts/native-messaging.md](contracts/native-messaging.md) — browser extension ↔ connector
- [contracts/database.md](contracts/database.md) — SQLite schema, transactions, migrations
- [i18n.md](i18n.md) — localisation rules
- [security.md](security.md) — Electron hardening
- [release.md](release.md) — builds, CI, versioning
