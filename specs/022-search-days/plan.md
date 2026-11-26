# Implementation Plan: Days of job search

- **Spec:** [spec.md](spec.md) · **Architecture:** [docs/architecture.md](../../docs/architecture.md)
- **Status:** Approved

## Summary

A pure domain function counts the calendar days from the creation day of the oldest
application to today. The analytics data gets this number, and the summary shows it as
its first tile. No IPC, schema or MCP change.

## Constitution check

| Principle | Complies? | Notes |
|-----------|-----------|-------|
| I. Spec first | Yes | Spec 022 approved 2026-11-26 |
| II. Local-first | Yes | Computed from the local data |
| III. Secure Electron | Yes | No change in main or preload |
| IV. Cross-platform | Yes | No platform code |
| V. i18n | Yes | One new label in `en` and `uk`; the number uses `Intl.NumberFormat` |
| VI. Tested | Yes | Unit tests for the domain function; e2e for the tile |
| VII. Simplicity | Yes | One function, one tile, no new dependency |
| VIII. Accessible | Yes | The tile is a term and a definition in the same list as the other totals |

## Requirement → component

| Requirement | Component |
|-------------|-----------|
| FR-002, FR-003, FR-005, FR-006 | `domain/analytics.ts#searchDays`, `AnalyticsData.searchDays` |
| FR-001, NFR-001, NFR-002 | `features/analytics/Totals`, `locales/*.json` |
| FR-004 | `features/analytics/Analytics`: computed with a new "now" on open and on each data change |

## Key decisions

- **D-1** The days are a difference of local calendar dates, computed in UTC, so a
  daylight saving change does not give a part of a day.
- **D-2** The number is a separate field of `AnalyticsData`, not part of
  `AnalyticsTotals`, because the totals are numbers of the period (005 FR-024).

## Risks

- **"Today" goes stale** when the analytics screen stays open past midnight. Mitigation:
  the same rule as the other numbers of spec 005 (FR-004); the screen counts again on
  open and on each data change.
