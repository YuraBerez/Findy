# Implementation Plan: Add a vacancy from the browser

- **Spec:** [spec.md](spec.md) · **Architecture:** [docs/architecture.md](../../docs/architecture.md)
- **Status:** Draft

## Summary

The extension is a small Manifest V3 add-on in `src/extension/`. Its popup reads the HTML of
the active tab, finds the job title and the company with `domain/vacancy`
(`extractVacancy`, spec 009), and talks to Findy through browser **native messaging**.
The browser starts the **connector**: a third entry of Findy's binary in Node mode
(`out/main/connector.js`), as the MCP server of architecture D-8. The connector uses the
same `Repository` and zod schemas, and the open app shows its writes through the
`data_version` watcher. On every start, the app writes a launcher script and a host
manifest for each installed browser.

## Technical context

| Item | Choice |
|------|--------|
| Language | TypeScript (strict), shared with the app |
| Extension | Manifest V3; React popup with `@ui` controls; built by Vite (already a dev dependency) for Chromium and Firefox |
| Transport | Native messaging: stdio, 4-byte length + UTF-8 JSON; own small codec, no dependency |
| Storage | The same SQLite database through `Repository`; no schema change |
| Testing | Vitest (codec, handler, link key, registration, popup logic); Playwright: connector over stdio + the extension in Chromium with a local vacancy page |
| Target platforms | Windows, macOS, Linux; Chrome, Edge, Brave, Opera, Vivaldi, Chromium, Firefox |

## Constitution check

| Principle | Complies? | Notes |
|-----------|-----------|-------|
| I. Spec first | ✅ | Spec 019 approved 2026-11-22 |
| II. Local-first | ✅ after T000 | New §II.9 (spec D-1) in a separate `constitution` PR. stdio only, no listener, no network requests in the extension or the connector |
| III. Secure Electron | ✅ | Connector has no window and never imports Electron. Host manifests allow only the two store ids. Every message is parsed with zod; size limit on input |
| IV. Cross-platform | ✅ | Registration per OS (files on macOS/Linux, `HKCU` keys on Windows). Launcher `.sh` / `.cmd`; the AppImage uses `Findy --connector` |
| V. i18n | ✅ | Popup strings in `locales/*.json` (`extension.*`); store name and description generated into `_locales/{en,uk}` |
| VI. Tested | ✅ | Unit tests for all `src/main/connector/**` and new domain code; e2e for US-1…US-4 |
| VII. Simplicity | ✅ | No new runtime dependency. The popup reuses React, i18next and `@ui` that the app already has |
| VIII. Accessible | ✅ | Popup is a form with labels; keyboard order; axe audit in e2e |

## Architecture

```
Browser tab ──executeScript(outerHTML)──▶ Popup (src/extension/)
                                            │ extractVacancy()  (src/domain/vacancy)
                                            │ sendNativeMessage("io.github.findy", …)
                                            ▼
                       launcher (.sh / .cmd in userData/connector/)
                                            ▼
                Findy binary, Node mode, out/main/connector.js ──▶ Repository ──▶ findy.db
                                                                                    ▲ WAL
Findy window ◀── findy:stateChanged ◀── watch.ts (data_version) ────────────────────┘
```

### Messages (new contract `docs/contracts/native-messaging.md`)

One request per connection (`sendNativeMessage`); the connector answers and exits.

| Request | Answer |
|---------|--------|
| `{ type: 'hello' }` | `{ ok: true, protocol: 1, version }` |
| `{ type: 'lookup', url }` | `{ ok: true, match: { stage } \| null }` (FR-006, FR-007; last updated wins) |
| `{ type: 'add', title, company, url }` | `{ ok: true, stage: 'applied' }` |
| anything else, or invalid | `{ ok: false, error: { code: 'VALIDATION' \| 'STORAGE' \| 'PROTOCOL', message } }` |

The popup sends `hello` first. No answer, or `protocol` ≠ 1, gives the US-3.1 message
(FR-010). Messages from the extension are limited to 64 KB (Chrome limits only the host's
answers).

### Requirement → component map

| Requirement | Component |
|-------------|-----------|
| FR-001, NFR-003 | `src/extension/manifest.json`: `activeTab`, `scripting`, `nativeMessaging`; `browser/page.ts` reads `outerHTML` (cut to 2 MB) on popup open |
| FR-002 | `extractVacancy` from `src/domain/vacancy`, bundled into the popup |
| FR-003, FR-005, US-2, US-3 | `src/extension/popup/` (React, `@ui` `TextField`, `Button`); state in `popup/state.ts` (pure, unit-tested) |
| FR-004 | `src/main/connector/handler.ts` → `Repository.createApplication` (stage `applied`, source from the link as spec 014 FR-020) |
| FR-006, FR-007 | `src/domain/links.ts` `vacancyLinkKey(url)`; `handler.ts` `lookup` over `Repository` applications |
| FR-008 | `handler.ts` answers only the shapes above |
| FR-009 | Connector writes through `Repository`; existing `watch.ts` |
| FR-010 | Popup `hello` + timeout; download link from `src/shared/project.ts` |
| FR-011 | `src/main/connector/register/` (manifest JSON, launcher text, browser folders, Windows registry); called from `start()` in `main/index.ts` |
| FR-012 | `scripts/build-extension.mjs`: two outputs, `chromium/` and `firefox/` (manifest differences only) |
| NFR-001, NFR-002 | No `fetch` in extension or connector (ESLint `no-restricted-globals` for `src/extension/`); `allowed_origins` / `allowed_extensions` from `src/shared/extension.ts`; zod in `handler.ts` |
| NFR-006 | `extension.*` keys in both locales; the build writes `_locales/*/messages.json` from them |
| NFR-007 | e2e uses `e2e/data/vacancy-server.ts` |

## Project structure

The extension is one more process next to `main`, `preload` and `renderer` (owner, 2026-11-22).

```
src/extension/
  manifest.json          # shared part; the build adds the keys of each browser
  icons/
  browser/               # the extension API of the browser
    chrome.d.ts          # types of the few calls that the popup uses
    page.ts              # read the active tab (2 MB cut)
    connector.ts         # native messaging with a timeout: hello, lookup, add
  popup/
    index.html, main.tsx
    state.ts             # what the popup shows (pure, unit-tested)
    Popup/               # Popup.tsx, Popup.module.css, index.ts
src/domain/links.ts      # vacancyLinkKey (FR-007)
src/main/connector/
  cli.ts                 # entry: out/main/connector.js (Node mode)
  codec.ts               # length-prefixed JSON frames
  handler.ts             # hello / lookup / add
  run.ts                 # one request, one answer
  register/              # index.ts facade; manifest.ts, launcher.ts, browsers.ts, windows.ts, fs.ts
src/shared/extension.ts  # host name, store ids, store links
scripts/build-extension.mjs  # → out/extension/{chromium,firefox}
tests/unit/extension/    # popup logic (tsconfig.extension.json)
docs/contracts/native-messaging.md
```

## Key decisions

### D-1 — A launcher script, not the binary, in the host manifest

- **Options considered:** point the manifest at the Findy binary with a `--connector`
  flag; write a launcher script.
- **Chosen:** a launcher in `userData/connector/` (`findy-connector.sh` with
  `ELECTRON_RUN_AS_NODE=1 exec "<binary>" "<connector.js>" "$@"`, or
  `findy-connector.cmd` on Windows). The AppImage launcher runs
  `"$APPIMAGE" --connector`, which forwards as `--mcp` does.
- **Why:** a host manifest cannot set environment variables or arguments. An Electron
  GUI process does not read stdin pipes reliably on Windows (architecture D-8). Node
  mode also starts fast enough for NFR-004.

### D-2 — Register on every app start (spec change)

- **Options considered:** installer scripts for NSIS, dmg, deb, Homebrew and Scoop;
  registration by the app.
- **Chosen:** the app writes the launcher and manifests on every start. On macOS and
  Linux it writes a manifest only for browsers whose profile folder exists, and only when
  the content changes. On Windows it sets the `HKCU` keys of Chrome, Chromium, Edge and
  Firefox on every start, because Brave, Opera and Vivaldi read the key of Chrome even
  when Chrome is not installed.
- Only a packaged app registers in the real home folder. Development and e2e runs
  register only when `FINDY_CONNECTOR_HOME` is set, into that folder. So they never change
  the browsers of the developer.
- **Why:** the dmg, the zip for Scoop and the AppImage have no install step. One code
  path covers the first start and every update. **This changes spec FR-011** ("the
  installer, and the first start") to "every start of the app"; the spec is updated in
  the same branch.

### D-3 — One Chromium build, published only in the Chrome Web Store

- **Chosen:** the Chromium build goes to the Chrome Web Store. Edge, Brave, Opera and
  Vivaldi install it from there. Firefox gets its build on addons.mozilla.org.
- **Why:** each store gives its own extension id, and the host manifest lists the ids it
  accepts. Two ids are easy to keep in `src/shared/extension.ts`. The Chromium id is
  fixed by the `key` field of the manifest, so it is known before the first upload and
  is the same in development.

### D-4 — One request per connection

- **Chosen:** `runtime.sendNativeMessage`; the connector handles one message and exits.
- **Why:** no long-lived process, no state, and the browser closes the process for us.

### D-5 — The popup uses React and `@ui`

- **Options considered:** plain DOM; React with `@ui`.
- **Chosen:** React with `@ui` controls and the theme tokens.
- **Why:** CLAUDE.md forbids duplicate controls and styles. React is already a
  dependency; the popup script is about 320 KB, read from disk.

## Risks

| Risk | Mitigation |
|------|------------|
| The Chrome Web Store does not accept the pinned `key` id | Upload a draft first (T050); if the id differs, change `src/shared/extension.ts` before the app release |
| Opera reads host manifests from the folder of Chrome (macOS, Linux); not tested in e2e | Chrome's folder is written when Opera is installed; manual check before the first release |
| Browsers in Flatpak or Snap cannot start host programs outside their sandbox | Out of scope for this spec; the popup shows the US-3.1 message; documented in README |
| Antivirus or policy blocks `.cmd` launchers on Windows | Smoke test in the packaged Windows build (T041); fallback: a small `.exe` launcher in a later spec |
| The AppImage moves to another folder | The app rewrites the launcher on the next start (D-2) |
| The page is very large or the HTML has no vacancy data | 2 MB cut before `extractVacancy`; empty fields, US-3.2 |
| Two Findy versions with different protocols | `hello` with `protocol`; US-3.1 message |
