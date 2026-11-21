# Tasks: Next step and reminders

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

Legend: `[P]` — can run in parallel with other `[P]` tasks in the same phase.
Each task references the requirement(s) it satisfies.

## Phase 1 — Setup

- [x] T001 Plan, tasks and docs: `docs/data-model.md`, `docs/contracts/database.md`
  (v5), `docs/contracts/ipc.md`, `docs/architecture.md` (D-16, project structure)

## Phase 2 — Foundations

- [ ] T010 `domain/nextStep/`: types, date and time rules, `stepStart`, with unit tests
  (FR-001, FR-002)
- [ ] T011 Status, the next status change, due reminders, with unit tests (FR-020, FR-023,
  FR-031…FR-034)
- [ ] T012 Formats: mark text, full date and time, CSV date text, with unit tests (FR-012,
  FR-020, FR-051)
- [ ] T013 zod `NextStepSchema` in the input and patch schemas, with unit tests (FR-001)
- [ ] T014 Migration 005 + migration test (FR-001)
- [ ] T015 Repository: read and write the step, `updatedAt` only, `completeNextStep`,
  `listNextSteps`, setting `remindersEnabled`; repository tests (FR-003, FR-004, FR-012,
  FR-030)
- [ ] T016 IPC: `nextStep` in create and update, `completeNextStep`,
  `setRemindersEnabled`; IPC tests (FR-012, FR-030)

## Phase 3 — US-1, US-3: plan and finish a step (P1)

- [ ] T020 Form values and validation in `domain/nextStep/form.ts`, with unit tests
  (FR-001, FR-011, US-1.3)
- [ ] T021 `NextStepSection` in the details panel: add, edit, done, remove; en + uk
  (FR-010…FR-012)
- [ ] T022 Card menu "Next step…" opens the details at the step (FR-013)
- [ ] T023 e2e: add, edit, validation, remove, done (US-1, US-3)

## Phase 4 — US-2: see what is due (P1)

- [ ] T030 Card mark with icon, text and accessible name; no mark in Rejected; en + uk
  (FR-020…FR-022, FR-024)
- [ ] T031 `useNow` waits for the next status change (FR-023)
- [ ] T032 e2e: today, tomorrow, later, overdue, Rejected, stale together (US-2)

## Phase 5 — US-4: reminders (P1)

- [ ] T040 `main/reminders.ts`: summary at start and at midnight, 15 minutes before,
  once per key, wake from sleep, off switch; unit tests with a fake clock (FR-031…FR-036)
- [ ] T041 Wiring in `main/index.ts`: `Notification`, click → window and
  `openApplication`, `powerMonitor`, checks after IPC and MCP changes (FR-035, FR-037)
- [ ] T042 "Reminders" toggle in the ⋯ menu; renderer opens the details on
  `openApplication`; en + uk (FR-030, FR-035)
- [ ] T043 e2e: reminder before a step, click opens the details, toggle off (US-4)

## Phase 6 — US-5: calendar file (P2)

- [ ] T050 `calendarEvent`, `calendarFileName`, with unit tests (FR-040, FR-041)
- [ ] T051 `main/calendar.ts` + IPC `saveNextStepCalendar`, unit tests; "Add to calendar"
  button (FR-040…FR-042)
- [ ] T052 e2e: save the file, check the event (US-5)

## Phase 7 — US-6: search, CSV, MCP (P2)

- [ ] T060 [P] Search matches the step text; unit tests (FR-050)
- [ ] T061 [P] CSV export and import of the 2 columns; unit tests (FR-051…FR-053)
- [ ] T062 [P] MCP tools: step in results, input on add and update; skill text; unit tests
  (FR-054)
- [ ] T063 e2e: search, CSV round trip, MCP sets a step (US-6)

## Phase 8 — Polish

- [ ] T090 README features list (en, uk); axe in both themes; full gate
