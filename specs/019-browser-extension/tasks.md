# Tasks: Add a vacancy from the browser

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

Legend: `[P]` — can run in parallel with other `[P]` tasks in the same phase.
Each task references the requirement(s) it satisfies.

## Phase 0 — Constitution and docs

- [ ] T000 Amendment §II.9 in a separate PR with the `constitution` label (spec D-1); merged before Phase 2
- [x] T001 Spec FR-011 → "every start of the app" (plan D-2); `docs/contracts/native-messaging.md`; architecture D-18 (FR-011, NFR-002)

## Phase 1 — Domain and shared

- [x] T010 [P] `domain/links.ts` `vacancyLinkKey`: host case, slash at the end, `#…`, tracking parameters; other query parameters kept; unit tests (FR-007)
- [x] T011 [P] `shared/extension.ts`: host name, Chromium and Firefox ids, store links; built from one constant (NFR-002)

## Phase 2 — Connector

- [x] T020 `connector/codec.ts`: read and write length-prefixed JSON frames, 64 KB input limit; unit tests (NFR-002)
- [x] T021 `connector/handler.ts`: `hello`, `lookup` (last updated match), `add` (stage `applied`, source from the link), zod, error codes, no other data; unit tests on an in-memory database (FR-004, FR-006, FR-008, FR-009)
- [x] T022 `connector/cli.ts` entry `out/main/connector.js`; `Findy --connector` forward; electron-vite input; logs to stderr (FR-009, plan D-1)

## Phase 3 — Registration

- [x] T030 `connector/register/`: manifest JSON (Chromium `allowed_origins`, Firefox `allowed_extensions`), launcher text per OS and for the AppImage; unit tests (FR-011, plan D-1)
- [x] T031 Browser folders on macOS and Linux, `HKCU` keys on Windows (through `reg.exe`); only installed browsers; write only on change; unit tests with a fake file system and a fake `reg` (FR-011, FR-012)
- [x] T032 Call registration from `start()`; a failure is logged and never stops the app (FR-011)

## Phase 4 — Extension

- [x] T040 `src/extension/` and `scripts/build-extension.mjs` (→ `out/extension/`): base manifest + Chromium (`key`, no background script) and Firefox (`browser_specific_settings`) outputs; `_locales` from `locales/*.json`; ESLint rules (no `fetch`, no Node); `npm run build:extension` (FR-012, NFR-001, NFR-006)
- [x] T041 `page.ts` (active tab HTML, 2 MB cut) and `native.ts` (timeout, `hello`, protocol check); popup `state.ts` reducer; unit tests (FR-001, FR-002, FR-005, FR-010)
- [x] T042 Popup UI with `@ui`: fields, "Add to Findy", "Already in Findy" + stage + "Add anyway", messages of US-3, download link; en/uk strings (FR-003, FR-005, FR-006, FR-010, US-3, US-4, NFR-005)

## Phase 5 — Verification and release

- [ ] T050 e2e: connector over stdio against the app (add, lookup, invalid input, open window shows the card) (US-1.2, US-1.4, US-2, FR-008, FR-009)
- [ ] T051 e2e: the extension in Chromium with a temporary profile, a host manifest in that profile, and the local vacancy page; axe on the popup (US-1.1–1.3, US-1.5, US-2.1–2.2, US-3.1–3.3, US-4, NFR-007)
- [ ] T052 Packaged smoke test on Windows, macOS and Linux: registration files exist and the launcher answers `hello` (FR-011, FR-012)
- [ ] T053 CI: build the extension in the CI job; docs/release.md (store upload steps, not done yet), docs/security.md, `PRIVACY.md` (spec D-8)
- [x] T054 Release workflow attaches the extension zips (Chromium, Firefox) to each app release; install guide `docs/guide/browser-extension.md` in English and Ukrainian, linked from the README (spec D-8)
