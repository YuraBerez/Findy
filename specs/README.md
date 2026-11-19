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
| 009 | [Add an application from a link](009-add-from-link/spec.md) | Implemented |
| 010 | [Stale applications](010-stale-applications/spec.md) | Approved |
