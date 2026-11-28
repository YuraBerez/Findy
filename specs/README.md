# Specs

Feature specifications. Findy is built with **spec-driven development**: a
feature is specified and planned here before any code is written.

Cross-cutting architecture (stack, data model, contracts, i18n, security,
releases) lives in [`/docs`](../docs/README.md). Project principles:
[docs/constitution.md](../docs/constitution.md).

## Layout

```
specs/
├── _templates/              # copy when starting a new feature
└── NNN-feature-name/
    ├── spec.md              # WHAT & WHY — user stories, requirements, acceptance
    ├── plan.md              # HOW this feature is built on top of /docs
    └── tasks.md             # ordered implementation checklist
```

## Workflow

| Step | Artifact | Gate |
|------|----------|------|
| 1. Specify | `spec.md` | Status `Approved`; no open `[NEEDS CLARIFICATION]` |
| 2. Plan | `plan.md` (+ updates to `/docs` if needed) | Passes the constitution check |
| 3. Break down | `tasks.md` | Every task references a requirement (`FR-xxx`) |
| 4. Implement | code + tests | Each PR ticks tasks and links requirements |
| 5. Verify | CI + manual acceptance | All acceptance scenarios pass → status `Implemented` |

Rules:

- One feature = one folder = one branch `NNN-feature-name`. Numbers are never reused.
- Mark ambiguities as `[NEEDS CLARIFICATION: question]` instead of guessing.
- If code must diverge from the spec, update the spec in the same PR.
- Status lifecycle: `Draft` → `Approved` → `Implemented` (or `Superseded by NNN`).

## Index

| # | Feature | Status |
|---|---------|--------|
| 001 | [MVP: job-search board](001-mvp-board/spec.md) | Implemented |
| 002 | [Hidden columns](002-hidden-columns/spec.md) | Implemented |
| 003 | [Error handling](003-error-handling/spec.md) | Implemented |
| 004 | [MCP server](004-mcp-server/spec.md) | Implemented |
| 005 | [Analytics](005-analytics/spec.md) | Implemented |
| 006 | [Update check](006-update-check/spec.md) | Implemented |
| 007 | [Card colours](007-card-colors/spec.md) | Implemented |
| 008 | [CSV export and import](008-csv-import-export/spec.md) | Implemented |
| 009 | [Add an application from a link](009-add-from-link/spec.md) | Implemented (0.4.0) |
| 010 | [Stale applications](010-stale-applications/spec.md) | Implemented (0.4.0) |
| 011 | [Job sites](011-job-sites/spec.md) | Implemented (0.4.0) |
| 012 | [Install with Homebrew and Scoop; verifiable releases](012-package-managers/spec.md) | Implemented (0.4.1) |
| 013 | [Congratulate on an offer and ask for support](013-offer-thanks/spec.md) | Implemented (0.5.0) |
| 014 | [More application fields](014-application-fields/spec.md) | Implemented (#39) |
| 015 | [Next step and reminders](015-next-step/spec.md) | Implemented (#42) |
| 016 | [A skill for AI assistants that use Findy](016-mcp-skill/spec.md) | Implemented (#40) |
| 017 | [Install the skill with one command](017-skill-install-command/spec.md) | Implemented (#41) |
| 018 | [One settings window](018-settings/spec.md) | Implemented (#44) |
| 019 | [Add a vacancy from the browser](019-browser-extension/spec.md) | Implemented (0.7.0) |
| 020 | [Project website](020-website/spec.md) | Implemented (#59) |
| 021 | [Delete stage history entries](021-delete-stage-history/spec.md) | Implemented (0.7.1) |
| 022 | [Days of job search](022-search-days/spec.md) | Implemented (0.7.2) |
| 023 | [Share analytics as an image](023-share-analytics-image/spec.md) | Implemented (0.8.0) |
| 024 | [Browser extension in the settings](024-extension-settings/spec.md) | Approved |
| 025 | [Card colours through the AI assistant](025-mcp-card-colors/spec.md) | Approved |
| 026 | [Polish language](026-polish/spec.md) | Approved |
| 027 | [Polish documentation and website](027-polish-docs/spec.md) | Draft |
