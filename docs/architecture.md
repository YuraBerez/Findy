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
├── domain/              # pure logic + zod schemas (shared)
│   ├── stages.ts        # STAGES constant, StageId
│   ├── schema.ts        # zod schemas for IPC input & entities
│   ├── board.ts         # validation + ordering rules for applications
│   └── notes.ts         # validation rules for notes
├── shared/
│   └── ipc.ts           # FindyApi, AppState, channel names
├── main/
│   ├── index.ts         # window, lifecycle, single instance, CSP
│   ├── ipc.ts           # ipcMain.handle registrations
│   ├── db/
│   │   ├── connection.ts    # open findy.db, pragmas, integrity check
│   │   ├── migrate.ts       # PRAGMA user_version + backups
│   │   ├── migrations/      # 001-init.ts, … (append-only)
│   │   └── repository.ts  # applications / notes / settings queries
│   ├── menu.ts          # localised native menu
│   └── i18n.ts          # main-process strings (menu, dialogs)
├── preload/
│   └── index.ts
└── renderer/            # component architecture (D-7)
    ├── index.html, main.tsx, i18n.ts, format.ts
    ├── app/             # App, Toolbar, useAppState (all IPC calls)
    ├── features/        # one folder per feature, one folder per component
    │   ├── board/       # Board/, Column/, Card/, CardActions/, dnd.ts, useBoardDnd.ts
    │   ├── applications/# ApplicationDialog/
    │   ├── settings/    # ThemeToggle/, LanguageSelect/
    │   └── storage/     # StorageError/
    ├── ui/              # design-system primitives: Button, IconButton, Field,
    │                    # TextField, Select, Dialog, Menu, Switch, icons, styles/
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
build/                   # icons, entitlements for electron-builder
.github/workflows/       # ci.yml, release.yml
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
- **No ORM:** plain SQL in `repository.ts` keeps the dependency count low
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
  (`domain/limits.ts`), because zod v4 probes `new Function()` on load.

### D-7 — Renderer: components in folders, primitives in `ui/`, no duplication

- **Layers** (imports go down only): `app/` → `features/*` → `ui/`.
  `ui/` has no business logic, no IPC and no i18n keys: it takes text as props.
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

## Cross-cutting docs

- [constitution.md](constitution.md) — project principles
- [data-model.md](data-model.md) — entities and invariants
- [contracts/ipc.md](contracts/ipc.md) — renderer ↔ main API
- [contracts/database.md](contracts/database.md) — SQLite schema, transactions, migrations
- [i18n.md](i18n.md) — localisation rules
- [security.md](security.md) — Electron hardening
- [release.md](release.md) — builds, CI, versioning
