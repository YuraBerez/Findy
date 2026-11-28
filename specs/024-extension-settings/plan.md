# Implementation Plan: Browser extension in the settings

- **Spec:** [spec.md](spec.md) · **Architecture:** [docs/architecture.md](../../docs/architecture.md)
- **Status:** Approved

## Summary

A new last category `extension` in `SettingsDialog`, with a page component
`features/extension/ExtensionSettings`. The page shows a description and three buttons. Each
button opens a link through the existing `openLink` action (`openExternal` in main, http(s)
only). The links are built in `src/shared/extension.ts` from `releaseFileUrl` and `SITE_URL`.
The version comes from `getAppInfo`, which the settings window reads when it opens. No new
IPC call, no network request from the app.

## Constitution check

| Principle | Complies? | Notes |
|-----------|-----------|-------|
| I. Spec first | Yes | Spec 024 approved 2026-11-28 |
| II. Local-first | Yes | No request: the system browser opens the links (FR-005) |
| III. Secure Electron | Yes | `openExternal` keeps the http(s) rule (§III.4); no new IPC |
| IV. Cross-platform | Yes | Links only |
| V. i18n | Yes | Texts in `en` and `uk`; the guide link follows the app language |
| VI. Tested | Yes | Unit tests for the link builders; e2e for the category and links |
| VII. Simplicity | Yes | One page component, two link builders |
| VIII. Accessible | Yes | `@ui` Buttons in a `@ui/Tabs` category, as the other pages |

## Requirement → component

| Requirement | Component |
|-------------|-----------|
| FR-001 | `features/settings/SettingsDialog` (`CATEGORIES`), `locales/*.json` (`settings.extension`) |
| FR-002…FR-004 | `features/extension/ExtensionSettings`; `shared/extension.ts#extensionFileUrl`, `#extensionGuideUrl` |
| FR-005, NFR-003 | `useAppState.openLink` (existing) |
| version for FR-003 | `useAppState.getAppInfo` (new action on the existing IPC call) |

## Key decisions

- **D-1** The file names come from one function that also documents the release names
  (`Findy-<version>-browser-extension.zip`, `…-Firefox.zip`, docs/release.md). A unit test
  compares them with `.github/workflows/release.yml`, so a rename cannot break the links.
- **D-2** The guide URL is `SITE_URL` + `guide/browser-extension/`, with `uk/` before it for
  Ukrainian, the same paths as the website (spec 020 FR-020). A unit test checks the guide
  file exists in both languages.

## Risks

- **Development version without a release:** the link opens GitHub's "not found" page
  (spec edge case); accepted.
