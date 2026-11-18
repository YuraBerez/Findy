# Tasks: Analytics

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

Legend: `[P]` — can run in parallel with other `[P]` tasks in the same phase.

## Phase 1 — Foundations

- [x] T001 Domain `analytics.ts`: periods, buckets (local time, Monday weeks), applications per bucket, stage entries per bucket, funnel, totals, hidden-stage filter; unit tests incl. DST (FR-010…FR-015, FR-020…FR-024)
- [x] T002 Settings row `analytics` + IPC `setAnalyticsView` (zod), default and damaged value; repository and IPC unit tests; docs: ipc.md, data-model.md (FR-030…FR-032)

## Phase 2 — Navigation (US-1)

- [ ] T010 `ui/Tabs`; toolbar tabs "Board | Analytics"; Ctrl/Cmd+1/2; board stays mounted; search and Add only on the board (FR-001…FR-004)

## Phase 3 — Analytics screen (US-2…US-7)

- [ ] T020 Chart tokens `--chart-1…6` (light/dark) and `ui/BarChart` with stacked series, hover and keyboard cursor, live caption (FR-025, NFR-002)
- [ ] T021 `features/analytics`: filters, totals, activity chart, stages chart with legend toggles, funnel, "Show as table", empty states; en/uk strings (FR-020…FR-026, FR-030, FR-031, FR-033, FR-040, FR-041, NFR-001)

## Phase 4 — Verification

- [ ] T030 e2e: history database seed; analytics screen object; scenarios US-1…US-7; axe in both themes and in Ukrainian (all FRs, NFR-001, NFR-002)
- [ ] T031 e2e: NFR-003 timing with 1 000 applications; NFR-005 at the minimum window size
- [ ] T032 Docs: architecture.md (structure, D-9), brand.md chart tokens; spec status
