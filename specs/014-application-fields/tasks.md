# Tasks: More application fields

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

Legend: `[P]` — can run in parallel with other `[P]` tasks in the same phase.
Each task references the requirement(s) it satisfies.

## Phase 1 — Setup

- [x] T001 Plan, tasks and docs: `docs/data-model.md`, `docs/contracts/database.md`
  (v4), `docs/contracts/ipc.md`, `docs/architecture.md` (project structure)

## Phase 2 — Foundations

- [x] T010 Domain types and rules in `domain/fields/` + limits, with unit tests
  (FR-001…FR-003)
- [x] T011 `sourceFromUrl` and `parseSourceText`, with unit tests (FR-020, FR-042)
- [x] T012 zod schemas: salary, source, input and patch fields, with unit tests
  (FR-001…FR-003)
- [x] T013 Migration 004 + migration test (FR-001, NFR-004)
- [x] T014 Repository: read and write the fields, `updatedAt` only, source from the link
  in `create` and `update`; repository and IPC tests (FR-004, FR-005, FR-020…FR-022)

## Phase 3 — US-1, US-2: salary, work format, location (P1)

- [ ] T020 Form values and validation for the extra fields in `domain/forms.ts`, with
  unit tests (FR-010, FR-012, FR-013)
- [ ] T021 `ApplicationExtraFields` in the details panel, currency default, en + uk
  strings (FR-010…FR-013)
- [ ] T022 Card line: `formatSalary`, work format, en + uk (FR-030…FR-032)
- [ ] T023 e2e: details and card for US-1, US-2

## Phase 4 — US-3, US-4: source and contact (P2)

- [ ] T030 Source select (known sites, custom sites, channels) and contact fields with
  the "Open" link action (FR-010, US-4.2)
- [ ] T031 e2e: source from the link, source kept, deleted custom site, contact link
  (US-3, US-4)

## Phase 5 — US-5: search, CSV, MCP (P2)

- [ ] T040 [P] Search matches location, source, contact; unit tests (FR-040)
- [ ] T041 [P] CSV export and import of the 9 columns, source from the link on import;
  unit tests (FR-041…FR-043, FR-022)
- [ ] T042 [P] MCP tools: fields in results, input on add and update; unit tests
  (FR-044, FR-022)
- [ ] T043 e2e: search, CSV round trip and old file, MCP update (US-5)

## Phase 6 — Polish

- [ ] T090 README features list (en, uk); axe in both themes; full gate
