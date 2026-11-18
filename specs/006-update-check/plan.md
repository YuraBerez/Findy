# Implementation Plan: Update check

- **Spec:** [spec.md](spec.md) · **Architecture:** [docs/architecture.md](../../docs/architecture.md)
- **Status:** Approved

## Summary

The main process asks the GitHub REST API for the latest release of
`YuraBerez/findy`, validates the answer with zod and compares versions with a pure
domain function. The renderer calls one IPC method, `checkForUpdates(trigger)`, at start
(`'auto'`) and from the app menu (`'manual'`). Main decides if an automatic check is
due, so the 24-hour rule is in one place. The result shows in a new `UpdateDialog`.
Two `settings` rows: the switch and the time of the last check. No migration, no new
dependency.

## Technical context

| Item | Choice |
|------|--------|
| Language | TypeScript (strict) |
| Network | Electron `net.fetch` in main; injected, so unit tests use a fake |
| Storage | `settings` rows `autoUpdateCheck`, `lastUpdateCheckAt` |
| Testing | Vitest (domain, updater, IPC, repository); e2e with a local release server |
| Target platforms | Windows, macOS, Linux (no platform code) |

## Constitution check

| Principle | Complies? | Notes |
|-----------|-----------|-------|
| I. Spec first | ✅ | Spec 006, approved 2026-11-18 |
| II. Local-first | ✅ after amendment | §II.6 (separate PR, D-1 of the spec): user-started, off by default, no user data |
| III. Secure Electron | ✅ | Request in main only; CSP of the renderer does not change; the answer is parsed with zod; only a `https://github.com/YuraBerez/findy/releases/` URL can open |
| IV. Cross-platform | ✅ | Same code on all three |
| V. i18n | ✅ | en + uk |
| VI. Tested | ✅ | Unit tests for every rule; e2e with a fake release server |
| VII. Simplicity | ✅ | No updater library; one request |
| VIII. Accessible | ✅ | Native dialog, menu item, menu switch; axe audit |

## Requirement → component map

| Requirements | Where |
|--------------|-------|
| FR-001, FR-002 | `features/updates/useUpdatesMenu` entries in the Toolbar app menu |
| FR-002 (persist), FR-004 | `SettingsStore`: rows `autoUpdateCheck`, `lastUpdateCheckAt`; IPC `setAutoUpdateCheck` |
| FR-003, FR-004, FR-010 | `main/updates.ts#createUpdateChecker`: `auto` returns `null` when off, not due or failed |
| FR-005, FR-011, FR-012 | `main/updates.ts#fetchLatestRelease`: one GET, no user data, 10 s timeout, size limit |
| FR-006 | `domain/updates.ts#compareVersions`, `isNewer` |
| FR-007, FR-008 | `features/updates/UpdateDialog`; `openLink` (spec 001 FR-015) |
| FR-009 | manual: dialog with the result; failure → IpcError `NETWORK` → notification (spec 003) |
| Edge: dialog open | `app/App` shows `UpdateDialog` only when no other dialog is open |

## IPC contract change

- `checkForUpdates(trigger: 'manual' | 'auto'): Promise<UpdateCheckResult | null>`
  - `{ status: 'available'; version; currentVersion; url } | { status: 'latest'; currentVersion }`
  - `'auto'`: `null` when off, not due, or failed; never rejects for a network error.
  - `'manual'`: rejects with the new code `NETWORK` when the check fails.
- `setAutoUpdateCheck(enabled: boolean): Promise<AppState>`.
- `AppState.settings.autoUpdateCheck: boolean` (default `false`).
- `IpcErrorCode` gets `NETWORK`; `errorKind` gets `network`.

## Key decisions

### D-1 — The request is in main, not in the renderer

- **Why:** The renderer CSP stays `connect-src 'self'`. Main validates the answer and
  allows only a release URL of this repository to open (constitution §III).

### D-2 — Main owns the 24-hour rule

- **Why:** One place for FR-003/FR-004. The renderer only says "auto" at start. A
  test can call the handler with a fixed clock.

### D-3 — `releases/latest` of the GitHub REST API

- **Why:** It returns the newest published, non-draft, non-pre-release release (FR-005)
  in one anonymous request. The rate limit (60 per hour per IP) is far above one check
  per day. The parser still rejects `draft` or `prerelease` set to true.

### D-4 — A test-only release URL

- `FINDY_RELEASES_URL` replaces the API URL, as `FINDY_USER_DATA_DIR` replaces the data
  folder. e2e starts a local HTTP server that answers like GitHub and counts requests
  (SC-001). The URL that "Download" opens is still checked against the repository.

## Risks

| Risk | Mitigation |
|------|------------|
| GitHub changes the API answer | zod schema; a bad answer is "no update" (auto) or an error (manual) |
| A hostile answer points "Download" to another site | Only a URL that starts with `RELEASE_PAGE_PREFIX` (`src/shared/project.ts`) passes |
| Slow network delays the start | The check is async after the window shows; 10 s timeout |
| Two checks at once (start + menu) | Main runs one request at a time and gives both callers its result |
