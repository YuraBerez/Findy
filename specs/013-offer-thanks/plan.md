# Implementation Plan: Congratulate on an offer and ask for support

- **Spec:** [spec.md](spec.md) · **Architecture:** [docs/architecture.md](../../docs/architecture.md)
- **Status:** Approved

## Summary

The renderer already sends every move that the user makes (drag and drop, keyboard,
card menu, details panel) through one action, `moveApplication` in `useAppState`. When
that move succeeds, goes from another stage to Offer, and the question is not answered
yet, the app opens the offer dialog. A CSV import and an MCP client change the database
in main and never call this action, so they never open the dialog (FR-002) without any
extra check. "Answered" is one new settings row, so there is no migration. The links come
from `src/shared/project.ts` and open through the existing `openExternal` call.

## Technical context

| Item | Choice |
|------|--------|
| Language | TypeScript (strict) |
| Storage | `settings` row `offerQuestionAnswered` (`'true'`); a missing or other value reads as `false` |
| UI | React; the dialog reuses `@ui/Dialog` and `@ui/Button` |
| Testing | Vitest (domain rule, settings store, IPC, native menu); e2e for every acceptance scenario |
| Target platforms | Windows, macOS, Linux (no platform code) |

## Constitution check

| Principle | Complies? | Notes |
|-----------|-----------|-------|
| I. Spec first | ✅ | Spec 013, approved 2026-11-20 |
| II. Local-first | ✅ | The answer is one local settings row; nothing is sent (FR-005) |
| III. Secure Electron | ✅ | One new IPC call without input; links go through the existing `openExternal` (http(s) only) |
| IV. Cross-platform | ✅ | No platform code; the native Help menu item exists on all three |
| V. i18n | ✅ | Dialog, menu items in en + uk |
| VI. Tested | ✅ | Unit: the rule, the settings row, IPC, the menu template; e2e: US-1, US-2 |
| VII. Simplicity | ✅ | No new table, no dependency; one rule, one dialog |
| VIII. Accessible | ✅ | `@ui/Dialog` moves focus in and back; Esc = Not now; all actions are buttons |

## Requirement → component map

| Requirements | Where |
|--------------|-------|
| FR-001, FR-002 | `domain/offer.ts`: `asksAboutOffer(from, to, answered)` → true only for a move from another stage to `offered` while not answered |
| FR-004, NFR-002 | `Settings.offerQuestionAnswered`; `SettingsStore.setOfferQuestionAnswered`; IPC `answerOfferQuestion()` → `AppState`; not in the CSV (the CSV has no settings) |
| FR-001, edge cases | `useAppState.moveApplication`: after a successful move, sets `offerAsk` when `asksAboutOffer` is true; one flag, so several moves give one dialog |
| FR-003, FR-009 | `features/support/OfferDialog`: step 1 (congratulations, Yes / Not really / Not now, Don't ask again), step 2a (Ko-fi, GitHub star), step 2b (feedback) |
| FR-006 | `shared/project.ts`: `SUPPORT_URL` (Ko-fi); `PROJECT_URL` for the star; `NEW_ISSUE_URL` for feedback |
| FR-010…FR-012 | `features/support/Confetti`: a fixed canvas, `pointer-events: none`, `aria-hidden`; about 150 pieces in the chart colours, gravity and drift, removed after 3 s; nothing when `prefers-reduced-motion: reduce`. `useAppState` counts confirmed moves to Offer (`isMoveToOffer`), and each count restarts it |
| FR-007 | Toolbar ⋯ menu: **Support Findy…**; native Help menu: **Support Findy…** (see D-2) |

## IPC contract change

```ts
answerOfferQuestion(): Promise<AppState>;   // spec 013; the offer dialog is never shown again
// Settings.offerQuestionAnswered: boolean (default false)
```

## Key decisions

### D-1 — The trigger is the renderer's move action, not a database event

- **Options considered:** main detects a stage change to Offer and sends an event;
  the renderer checks its own move.
- **Chosen:** the renderer's move action.
- **Why:** only moves that the user makes in the app pass through it, which is exactly
  FR-002. Main would have to tell an import and an MCP call apart from a user move.

### D-2 — "Support Findy" in the native Help menu, not inside About

- **Why:** About is the operating system's own panel (macOS) or Electron's message box;
  neither can hold a clickable link. The Help menu already has "Findy on GitHub", so
  "Support Findy…" goes next to it. The spec (US-2.2, FR-007) is changed to say so.

### D-3 — The dialog waits for the details panel

- **Why:** a move from the details panel happens while that panel is open. Two dialogs
  on top of each other are confusing, so the offer dialog opens when the details panel
  closes (the same rule as the update dialog). The spec edge cases say so.

## Risks

| Risk | Mitigation |
|------|------------|
| The dialog feels like a nag | Shown only after an offer; a final answer ends it forever; no banners (spec) |
| The move fails after the optimistic update | The flag is set only after main confirms the move |
