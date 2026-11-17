# CLAUDE.md

Guidance for Claude Code (and other AI agents) working in this repository.

## Project

Findy — open-source Electron desktop app for tracking a job search as a kanban
board (stages: applied → HR → test task → technical → C-level → offer/rejected),
with notes per application, en/uk UI, builds for Windows/macOS/Linux.

## Where things are

- `docs/` — cross-cutting architecture: **read [docs/constitution.md](docs/constitution.md)
  and [docs/architecture.md](docs/architecture.md) before any change.**
  Data model, IPC and file contracts, i18n, security, release.
- `specs/NNN-name/` — feature specs: `spec.md` (what/why), `plan.md` (how),
  `tasks.md` (checklist). Workflow: [specs/README.md](specs/README.md).
- `src/` — code (layout in architecture.md → *Project structure*).

## Spec-driven workflow — rules for agents

1. **No code without a spec.** If asked to implement something that has no
   approved spec, draft/extend the spec first (from `specs/_templates/`) and
   ask for approval.
2. Implement **task by task** from `tasks.md`. Tick the checkbox (`- [x]`) in the
   same change that completes the task.
3. Reference requirement ids (`FR-0xx`, `NFR-0xx`) in tests and commit messages,
   e.g. `feat(board): move cards between stages (FR-020, FR-021)`.
4. If the code needs to differ from the spec or docs, **update the spec/docs in
   the same change** and say so explicitly. Never let them drift.
5. Do not resolve `[NEEDS CLARIFICATION]` items by guessing; ask the user.
6. Spec `Status: Draft` means not approved — don't start implementation phases
   beyond setup without the user's go-ahead.

## Code rules

- TypeScript strict. Business logic goes in `src/domain` (pure, no Electron/React/fs).
- Renderer never imports Node/Electron; it uses only `window.findy`
  (see docs/contracts/ipc.md). Validate all IPC input with zod in main.
- Every user-visible string goes into **both** `locales/en.json` and
  `locales/uk.json` (Ukrainian plurals: `_one`, `_few`, `_many`, `_other`).
- Database: SQLite (`better-sqlite3`) only in `src/main/db`. Schema change →
  new migration file + test; never edit a released migration
  (docs/contracts/database.md). Each IPC mutation runs in one transaction.
- Follow docs/security.md for anything in `src/main` or `src/preload`.
- E2E: `e2e/` follows playwright-e2e-kit layers (specs → steps → screens, data via fixtures);
  ESLint enforces them. No locators or raw `page` in specs. See docs/architecture.md D-6.

## Commands

```bash
npm run dev        # run app
npm test           # unit tests (Vitest)
npm run test:coverage  # unit tests + 80 % coverage gate (same as CI)
npm run test:e2e   # e2e (Playwright + Electron, playwright-e2e-kit layers in e2e/)
npm run lint       # eslint + tsc
npm run dist       # installer for current OS
```

Before finishing a task: `npm run lint && npm run test:coverage` must pass
(coverage ≥ 80 %, see docs/release.md → CI). New code in `src/domain`,
`src/main`, `src/shared` needs unit tests.

## Skills

Project skills live in `.claude/skills/`. Use them for these steps:

| Step | Skill |
|------|-------|
| Raw idea → approved `spec.md` | `/refine-requirements` |
| Approved spec → plan, tasks, code, PR | `/deliver-feature` |
| Open or finish a PR | `/pr-submission` |
| Screenshots of changed UI (only on request) | `/pr-ui-screenshots` |
| Review a contributor's PR | `/review-pr` |
| Any user-visible text, dates, plurals | `/localization` |
| Any English documentation | `/writing-style` |
| End of a substantive task | `/learn` |
