# Findy Constitution

The non-negotiable principles of the project. Every spec, plan, task and pull
request must comply. Changing this document requires its own PR with the
`constitution` label and a short rationale.

**Version:** 1.4.0 · **Ratified:** 2026-11-17 · **Amended:** 2026-11-17 (§II.5), 2026-11-18 (§II.6), 2026-11-19 (§II.7, §II.8)

---

## I. Spec first

No production code is written without an approved spec.

1. Every feature lives in `specs/NNN-short-name/` and goes through
   `spec.md` → `plan.md` → `tasks.md` → implementation.
2. `spec.md` describes **what** and **why** (user stories, requirements,
   acceptance criteria). It contains no implementation details.
3. `plan.md` describes **how** this feature fits into the architecture.
   Cross-cutting decisions (stack, data model, contracts) live in
   `docs/` and are changed only together with the spec that needs it.
4. `tasks.md` is an ordered, checkable list derived from the plan.
5. If implementation reveals that a spec is wrong, the spec is updated **in the
   same PR** as the code. Code and specs never drift apart.
6. Requirements are numbered (`FR-001`, `NFR-001`) and referenced from tasks,
   tests and PR descriptions.

## II. Local-first and private

1. All user data stays on the user's machine. No accounts, no cloud, no servers.
2. No telemetry, analytics or crash reporting without an explicit opt-in spec.
3. The app is fully functional offline.
4. User data is stored in a local database in an open, documented format
   (SQLite) so users are never locked in.
5. **Exception — user-initiated sharing with an AI assistant.** A local MCP
   server (stdio, no network listener) may give the user's data to an MCP client
   such as Claude, only after the user turns this on in the app (off by default)
   and only for the calls the user's assistant makes. Findy itself still makes no
   network requests. See spec 004.
6. **Exception — update check.** The app may ask the project's public release page
   for the latest version. It does this only when the user starts a check, or after
   the user turns on the automatic check (off by default). The request sends no user
   data: no applications, notes, settings, identifiers or usage data. The app does
   not download or install anything. See spec 006.
7. **Exception — vacancy link.** When the user pastes a vacancy link in the app, or
   asks the app to fill the application from it, the app may read that one page to
   fill in the job title and the company. The request goes only to that link and
   sends no user data: no cookies, stored logins, applications, notes, settings or
   identifiers. The app runs no code from the page and keeps no copy of it.
   See spec 009.
8. **Exception — job site icons.** The app may download the icon of a job site in its
   list of job sites once, keep it locally and try again later if it failed. The request
   goes only to that site's host and sends no user data: no search query, no list of
   sites, no cookies or identifiers. The app opens the sites themselves only in the
   system browser. See spec 011.

## III. Secure Electron by default

1. `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` for every
   renderer.
2. The renderer talks to the main process only through a typed, minimal API
   exposed via `contextBridge`. Every IPC payload is validated in the main
   process.
3. A strict Content-Security-Policy is set; no remote code is loaded.
4. External links open in the system browser and only for `http:`/`https:`.

## IV. Cross-platform parity

1. Windows, macOS and Linux are first-class. A feature that does not work on all
   three is not done.
2. Every release publishes installable builds for all three platforms from CI.
3. Native modules only when justified in docs/architecture.md and buildable
   for every target platform/arch in CI (currently: `better-sqlite3`).

## V. Internationalised from day one

1. No user-visible string is hard-coded in components. All strings go through
   the i18n layer.
2. Supported languages: English (`en`, default/fallback) and Ukrainian (`uk`).
3. A PR that adds a string must add it to **both** locales. CI fails on missing
   keys.
4. Dates and numbers are formatted with the active locale.

## VI. Tested behaviour

1. Every acceptance criterion in a spec maps to at least one automated test
   (unit, integration or e2e).
2. Domain logic (board, items, notes, persistence) is pure and unit-tested
   independently of Electron and React.
3. `main` is always releasable: lint, type-check and tests pass in CI.
4. **Quality gate:** every PR must keep unit-test coverage at **≥ 80 %**
   (lines, branches, functions, statements). Lowering the threshold requires a
   constitution change.

## VII. Simplicity

1. Prefer the smallest solution that satisfies the spec. YAGNI.
2. New dependencies must be justified in the plan (size, maintenance, licence).
3. Licences of dependencies must be compatible with MIT.

## VIII. Accessible

1. Every action is reachable by keyboard (including moving cards between
   columns without drag-and-drop).
2. Interactive elements have accessible names; colour is never the only signal.
