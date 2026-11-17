# Implementation Plan: MVP — Job-search board

- **Spec:** [spec.md](spec.md) · **Architecture:** [docs/architecture.md](../../docs/architecture.md)
- **Status:** Approved

## Summary

This is the first feature, so it bootstraps the whole application: Electron +
React + TypeScript project, secure main/preload/renderer split, local SQLite database,
the board with drag-and-drop, notes, en/uk localisation and a CI pipeline that
publishes Windows/macOS/Linux builds. It establishes everything described in
`/docs`.

## Docs introduced by this feature

| Doc | Covers |
|-----|--------|
| [architecture.md](../../docs/architecture.md) | Stack, process model, project structure |
| [data-model.md](../../docs/data-model.md) | Application, StageChange, Note, Settings |
| [contracts/ipc.md](../../docs/contracts/ipc.md) | `window.findy` API |
| [contracts/database.md](../../docs/contracts/database.md) | SQLite schema v1 (`findy.db`), migrations |
| [i18n.md](../../docs/i18n.md) | Locale files, plurals, language resolution |
| [security.md](../../docs/security.md) | Electron hardening |
| [release.md](../../docs/release.md) | Build targets and release workflow |

## Constitution check

| Principle | Complies? | Notes |
|-----------|-----------|-------|
| I. Spec first | ✅ | This plan + tasks precede code |
| II. Local-first | ✅ | Local SQLite file in `userData`; no network (NFR-001) |
| III. Secure Electron | ✅ | See security.md; zod validation on every IPC call |
| IV. Cross-platform | ✅ | One native module (`better-sqlite3`, justified in D-2), rebuilt per OS/arch on a CI matrix |
| V. i18n | ✅ | i18next; key-parity test in CI |
| VI. Tested | ✅ | Domain unit tests; e2e per acceptance scenario |
| VII. Simplicity | ✅ | Fixed stages, plain SQL (no ORM), no state library (React state + IPC) |
| VIII. Accessible | ✅ | dnd-kit keyboard sensor + "Move to…" menu |

## Requirement → component map

| Requirements | Where |
|--------------|-------|
| FR-001…004 | `renderer/components/Board`, `Column`, `Card`; `domain/stages.ts` |
| FR-010…015 | `domain/board.ts`, `ApplicationDialog`, `main/ipc.ts` (`openExternal`) |
| FR-020…024 | `domain/board.ts#moveApplication`, dnd-kit in `Board`, `Card` menu |
| FR-030…033 | `domain/notes.ts`, `NotesPanel` |
| FR-040…044 | `locales/*.json`, `renderer/i18n.ts`, `main/i18n.ts`, `main/menu.ts` |
| FR-050…054 | `main/db/*` (connection, migrate, migrations/001-init.ts, repositories) |
| FR-060 | `domain/search.ts`, `SearchBox` |
| FR-080…083 | `settings` row `theme`, `setTheme` IPC → `nativeTheme.themeSource`, sun/moon `ThemeToggle` in toolbar, CSS tokens under `prefers-color-scheme` |
| FR-070…072 | `electron-builder.yml`, `.github/workflows/release.yml`, About dialog |

## UI sketch

```
┌ Findy ─────────────────────────────────────────────────── [🔍 search] [＋ Add] [⚙] ┐
│ Applied (3) │ HR interview (1) │ Test task │ Technical │ C-level │ Offer │ Rejected │
│ ┌─────────┐ │ ┌─────────────┐  │           │           │         │       │          │
│ │Frontend │ │ │Backend Dev  │  │           │           │         │       │          │
│ │Acme     │ │ │Globex       │  │           │           │         │       │          │
│ │💬2 · 3d │ │ │💬0 · 1d  ⋯  │  │           │           │         │       │          │
│ └─────────┘ │ └─────────────┘  │           │           │         │       │          │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

Clicking a card opens a side panel with editable fields, stage history,
the vacancy link and notes.

## Risks

| Risk | Mitigation |
|------|-----------|
| Unsigned macOS builds blocked by Gatekeeper | Documented workaround; signing as a follow-up spec |
| Native module fails to load on a platform/arch | Node-API prebuilds (no rebuild); CI packages on all 3 OSes and runs `smoke:packaged` on every PR |
| Performance at large volume (NFR-002) | Indexes on `(stage, position)` and `application_id`; measure with 1 000-item fixture |
| Ukrainian plural forms wrong | Unit tests for 1/2/5/11/21 counts |
