# Tasks: A skill for AI assistants that use Findy

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

Legend: `[P]` — can run in parallel with other `[P]` tasks in the same phase.
Each task references the requirement(s) it satisfies.

## Phase 1 — Setup

- [x] T001 Plan, tasks and docs: `docs/contracts/ipc.md`, `docs/architecture.md` (D-15,
  project structure), `docs/release.md`

## Phase 2 — The skill (US-4)

- [x] T010 `skills/findy/SKILL.md`: tools, stages, fields, four workflows, rules, no
  connection (FR-001…FR-007, NFR-004)
- [x] T011 Parity test: skill tools = MCP tools; front matter; length (NFR-003)

## Phase 3 — Save from the app (US-1)

- [ ] T020 Zip writer + skill saver in main, with unit tests (FR-010, FR-012, FR-021)
- [ ] T021 IPC `saveSkill`, with tests (FR-021, FR-022)
- [ ] T022 MCP dialog section "Skill", notification, install link; en + uk
  (FR-020…FR-024)
- [ ] T023 e2e: save the skill (also with access off), cancel, the install link (US-1)

## Phase 4 — Release and instructions (US-2, US-3)

- [ ] T030 Release workflow uploads the skill archive (FR-011)
- [ ] T031 README en + uk: "Install the Findy skill", link from the MCP section (FR-030)

## Phase 5 — Polish

- [ ] T090 Full gate
