# Implementation Plan: Stale applications

- **Spec:** [spec.md](spec.md) · **Architecture:** [docs/architecture.md](../../docs/architecture.md)
- **Status:** Approved

## Summary

"Stale" is computed, not stored: a pure function in `src/domain` takes an application,
N and the current time. N is one new settings row (`staleAfterDays`), so there is no
migration. The renderer keeps a clock that ticks once an hour and passes "now" to the
board; the card shows the mark, the toolbar shows the toggle with the count, and the
board filter combines the toggle with the search. The app menu opens a small dialog
for N. One new IPC call, `setStaleAfterDays`.

## Technical context

| Item | Choice |
|------|--------|
| Language | TypeScript (strict) |
| Storage | `settings` row `staleAfterDays` (whole number as text); a missing or invalid value reads as 14 |
| UI | React; `@ui/Button` gets a `pressed` state for the toggle; the dialog reuses `@ui/Dialog` and `@ui/TextField` |
| Testing | Vitest (domain, settings store, IPC); e2e with a seeded history database and Playwright's clock |
| Target platforms | Windows, macOS, Linux (no platform code) |

## Constitution check

| Principle | Complies? | Notes |
|-----------|-----------|-------|
| I. Spec first | ✅ | Spec 010, approved 2026-11-19 |
| II. Local-first | ✅ | Computed locally; no network |
| III. Secure Electron | ✅ | One new IPC call, its input parsed with zod (whole number 3–90) |
| IV. Cross-platform | ✅ | No platform code |
| V. i18n | ✅ | Mark, toggle, menu item and dialog in en + uk; Ukrainian plurals for days and the count |
| VI. Tested | ✅ | Unit: the stale rule at the edges (N, N + 1, final stages, clock back), settings parse, IPC; e2e: every acceptance scenario; perf for NFR-002 |
| VII. Simplicity | ✅ | No new table, no stored flag, no timers per card: one clock for the app |
| VIII. Accessible | ✅ | Toggle is a button with `aria-pressed`; mark is text + icon in the card's accessible name; dialog has a labelled number field with an error |

## Requirement → component map

| Requirements | Where |
|--------------|-------|
| FR-001, FR-002 | `domain/stale.ts`: `STALE_DAYS` (min 3, max 90, default 14), `FINAL_STAGES` (offered, rejected), `staleDays(application, n, now)` → whole days in the stage when more than N and not final, else `null`; based on `enteredStageAt` (only a stage change resets it) |
| FR-008, FR-009 | `Settings.staleAfterDays`; `SettingsStore.setStaleAfterDays`, parse with the range; `StaleAfterDaysSchema` (zod); IPC `setStaleAfterDays(days)` → `AppState` |
| FR-004 | `renderer/hooks/useNow.ts`: the current time, updated once an hour; `App` passes it to the board and the toolbar |
| FR-003, NFR-001 | `CardContent`: a mark (clock icon + "No movement for {count} days") inside the card handle, so it is in the accessible name; `BoardActions` gets `staleDays(application)` |
| FR-005, FR-007, FR-010 | `features/stale/StaleToggle`: `@ui/Button` with `pressed`; count of stale applications in visible columns; `App` state, not saved; turns itself off when the count is 0 |
| FR-006 | `domain/search.ts`: `filterApplications(applications, query, also)` with the stale check as `also`; `Board` maps drop positions when any filter is on |
| FR-008 | `features/stale/StaleAfterDialog` (number field 3–90, validation, Save / Cancel) and the menu entry from `useStaleMenu` |
| NFR-002 | e2e `performance.spec.ts`: toggle on and off with 1 000 applications |

## IPC contract change

```ts
setStaleAfterDays(days: number): Promise<AppState>;   // spec 010; VALIDATION unless a whole number 3–90
// Settings.staleAfterDays: number (default 14)
```

## Key decisions

### D-1 — Computed in the renderer from the state, not stored

- **Options considered:** a stored `stale` flag updated by main; a computed value.
- **Chosen:** computed with a pure domain function.
- **Why:** "stale" depends on the time, so a stored flag would be out of date at once.
  The data for it (stage history) is already in the state.

### D-2 — One clock for the app, once an hour

- **Why:** FR-004 asks for at least once an hour. One `useNow` in `App` re-renders the
  board once an hour; a move re-renders at once anyway. A timer per card would cost
  more for nothing.

### D-3 — The filter joins the search in the domain

- **Why:** FR-006: the toggle and the search work together. One `filterApplications`
  with both conditions keeps the drop-position mapping (`toFullIndex`) the same for
  both filters.

## Risks

- **Playwright's clock in Electron** (US-1.6) → if `page.clock` does not reach the
  renderer timers, test the hour tick with a short interval option of `useNow` and
  keep the edge-of-day rule in unit tests.
- **Contrast of the mark on tinted cards** → axe in both themes with coloured stale
  cards, as for spec 007.
