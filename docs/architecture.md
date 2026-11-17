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
| Styling | CSS Modules + CSS variables | No runtime cost; light/dark via `prefers-color-scheme` |
| Drag & drop | **@dnd-kit** | Accessible (keyboard sensor), maintained |
| i18n | **i18next** + **react-i18next** | Interpolation, plurals (Ukrainian has 3 plural forms) |
| Validation | **zod** | One schema → TS types + runtime validation in main |
| Database | **SQLite** via **better-sqlite3** | Local embedded DB, transactions, migrations (see D-2) |
| Packaging | **electron-builder** | Win/mac/Linux targets from CI |
| Unit tests | **Vitest** + `@vitest/coverage-v8` | Native to Vite; coverage gate ≥ 80 % |
| E2E tests | **Playwright** (`_electron`) | Drives the real packaged-like app |
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
│   │   ├── migrations/      # 001-init.sql, …
│   │   └── repositories.ts  # applications / notes / settings queries
│   ├── menu.ts          # localised native menu
│   └── i18n.ts          # main-process strings (menu, dialogs)
├── preload/
│   └── index.ts
└── renderer/
    ├── index.html
    ├── main.tsx
    ├── i18n.ts
    ├── components/
    └── styles/
locales/
├── en.json              # single source for main + renderer strings
└── uk.json
tests/
├── unit/                # Vitest: domain, store, i18n key parity
└── e2e/                 # Playwright: acceptance scenarios
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
- **No ORM:** plain SQL in `repositories.ts` keeps the dependency count low
  (§VII); revisit if queries become complex.

### D-3 — Main process is the single source of truth

- **Why:** One writer → no races; validation in one trusted place (§III.2).

### D-4 — Fixed stages in code

- **Why:** Spec 001 fixes the stages. Stored as ids so a future
  "custom stages" spec can migrate to user-defined stages.

### D-5 — Unsigned builds for MVP

- **Why:** Signing certificates cost money; decided in spec 001 (D-3).
  README documents how to open unsigned apps.

## Cross-cutting docs

- [constitution.md](constitution.md) — project principles
- [data-model.md](data-model.md) — entities and invariants
- [contracts/ipc.md](contracts/ipc.md) — renderer ↔ main API
- [contracts/database.md](contracts/database.md) — SQLite schema, transactions, migrations
- [i18n.md](i18n.md) — localisation rules
- [security.md](security.md) — Electron hardening
- [release.md](release.md) — builds, CI, versioning
