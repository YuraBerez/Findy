# Implementation Plan: Analytics

- **Spec:** [spec.md](spec.md) · **Architecture:** [docs/architecture.md](../../docs/architecture.md)
- **Status:** Approved

## Summary

All numbers come from a pure domain module, `src/domain/analytics.ts`. It takes the
applications, the hidden stages, the period, the grouping and "now", and returns the
buckets, the series, the funnel and the totals. The renderer calls it in a `useMemo`
on the state that it already has, so analytics updates with every new `AppState`
(also after an MCP change). The charts are small SVG components in `ui/`. There is
no chart library. The period and grouping are one new settings row, `analytics`,
saved through one new IPC call.

## Technical context

| Item | Choice |
|------|--------|
| Language | TypeScript (strict) |
| Frameworks | React, i18next; no new dependency |
| Storage | One `settings` row `analytics` (JSON); no migration |
| Testing | Vitest (domain, repository, IPC); Playwright e2e (all scenarios, axe, NFR-003) |
| Target platforms | Windows, macOS, Linux (renderer only, no native code) |

## Constitution check

| Principle | Complies? | Notes |
|-----------|-----------|-------|
| I. Spec first | ✅ | Spec 005, approved 2026-11-18 |
| II. Local-first | ✅ | Calculated in the renderer from local data; no network |
| III. Secure Electron | ✅ | One new IPC call, parsed with zod in main |
| IV. Cross-platform | ✅ | SVG and CSS only; Ctrl on Windows/Linux, Cmd on macOS |
| V. i18n | ✅ | en + uk keys; dates and numbers through `Intl` |
| VI. Tested | ✅ | Domain unit tests for every rule; e2e for every scenario |
| VII. Simplicity | ✅ | No chart library (D-1); no schema change |
| VIII. Accessible | ✅ | ARIA tabs, keyboard on charts, "Show as table", labels next to colours |

## Requirement → component map

| Requirements | Where |
|--------------|-------|
| FR-001, FR-002 | `ui/Tabs` (ARIA tabs, roving focus); `app/Toolbar`; shortcuts in `app/App` |
| FR-003 | `app/App`: the board stays mounted and gets `hidden`; the details panel shows only on the board tab |
| FR-004 | `app/Toolbar`: search and "Add application" only on the board tab |
| FR-010…FR-015 | `domain/analytics.ts`: `periodRange`, `buckets`, `bucketKey`, stage filter |
| FR-020, FR-021 | `domain/analytics.ts#activity`, `#stageEntries`; `features/analytics/*`; `ui/BarChart` |
| FR-022, FR-023 | `domain/analytics.ts#funnel`; `features/analytics/Funnel` |
| FR-024 | `domain/analytics.ts#totals`; `features/analytics/Totals` |
| FR-025, FR-026 | `ui/BarChart` (hover title, keyboard cursor, live value); `features/analytics/ChartCard` (table toggle) |
| FR-030…FR-032 | `features/analytics/AnalyticsFilters`; settings row `analytics`; IPC `setAnalyticsView` |
| FR-033 | `useMemo` over `state.applications` in `features/analytics/Analytics` |
| FR-040, FR-041 | `features/analytics/Analytics` empty states |
| NFR-003 | One pass over applications and stage entries per calculation (O(n)); e2e timing |

## IPC contract change

- `setAnalyticsView(view: { period: AnalyticsPeriod; grouping: AnalyticsGrouping }): Promise<AppState>`.
- `AnalyticsPeriod = '7d' | '30d' | '90d' | 'all'`, `AnalyticsGrouping = 'day' | 'week' | 'month'`.
- `AppState.settings` gets `analytics: { period; grouping }`, default `{ period: '30d', grouping: 'day' }`.
- A damaged row reads as the default, as `hiddenStages` does.
- Update `docs/contracts/ipc.md` and `docs/data-model.md`.

## Project structure

```
src/domain/analytics.ts                 # pure: periods, buckets, series, funnel, totals
src/renderer/ui/Tabs/                   # ARIA tablist with roving focus
src/renderer/ui/BarChart/               # SVG bars, one or more stacked series
src/renderer/features/analytics/
  Analytics/                            # the screen: filters, totals, charts, empty states
  AnalyticsFilters/                     # period and grouping selects
  ChartCard/                            # title, chart / table toggle
  Totals/                               # four numbers
  Funnel/                               # horizontal bars with counts and %
  index.ts
```

## Key decisions

### D-1 — Charts in SVG, without a chart library

- **Options considered:** Recharts, Chart.js, hand-written SVG.
- **Chosen:** hand-written SVG in `ui/BarChart`; the funnel is CSS bars.
- **Why:** The spec needs only bars. A library adds 50–150 kB, its own colours and
  its own a11y rules (constitution §VII). An SVG chart uses our tokens in both
  themes and passes the CSP without changes.

### D-2 — "Stages over time" is a stacked bar chart

- **Why:** The same component as "Applications per day". A stack shows the total
  activity and the part of each stage. The legend turns stages on and off (FR-021).

### D-3 — Keyboard on a chart: one tab stop, arrows move a cursor

- **Why:** "All time" by day can have more than 700 bars; 700 tab stops are not
  usable. The chart is one focusable element. Left/Right/Home/End move a cursor.
  The value of the cursor bucket shows in a caption with `aria-live="polite"`.
  The mouse shows the same caption on hover (FR-025).

### D-4 — The board stays mounted under the analytics tab

- **Why:** FR-003. Unmounting would lose scroll and drag state. The `hidden`
  attribute removes it from layout and from the accessibility tree.

### D-5 — Series colours are tokens

- `--chart-1…--chart-6` in `global.css`, light and dark, with 3:1 contrast against
  `--surface` (WCAG 1.4.11). Each stage keeps the same colour in every chart.
  Labels in the legend and the table carry the meaning; colour is never the only signal.

### D-6 — Week starts on Monday, buckets in local time

- Spec FR-012. A bucket key is the local date of its first day (`YYYY-MM-DD`).
  The domain functions take `now` as an argument, so tests fix the date. Tests build
  dates with the local `Date` constructor, so they pass in every time zone.

## Risks

| Risk | Mitigation |
|------|------------|
| DST and time zones move a stage entry to the wrong day | Local `Date` getters only; unit tests across a DST change |
| 1 000 applications + "all time" by day is slow | One pass, a `Map` of bucket keys; e2e timing for NFR-003 |
| Ctrl/Cmd+1/2 conflict with the native menu | The native menu has no such accelerators (checked in `menuTemplate.ts`) |
| Colours too close for colour-blind users | Legend and table labels; stage order is the same in stack and legend |
| Narrow window | Charts use the width of the container (`viewBox` + `preserveAspectRatio`), axis labels thin out |
