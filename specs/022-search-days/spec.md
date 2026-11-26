# Feature Spec: Days of job search

- **ID:** 022-search-days
- **Status:** Approved
- **Approved:** 2026-11-26 (owner)
- **Author(s):** owner
- **Created:** 2026-11-26
- **Builds on:** [005-analytics](../005-analytics/spec.md) (FR-010, FR-012, FR-024)

## Summary

The user wants to see how long the job search takes. A new tile in the analytics
summary shows the number of days from the first application to today. It is the first
tile, before "Applications sent", "Interviews", "Offers" and "Rejections".

## User stories

### US-1 — See how many days I search (P1)

As a user, I want to see the number of days of my job search so that I know how long
it takes.

**Acceptance scenarios**

1. **Given** the first application was created on 1 Nov and today is 10 Nov, **When**
   I open analytics, **Then** the first tile of the summary shows "Days of search: 10".
2. **Given** the only application was created today, **Then** the tile shows 1.
3. **Given** the same data, **When** I select another period, **Then** the tile does
   not change.
4. **Given** I delete the oldest application, **Then** the tile counts from the next
   oldest one at once.

## Functional requirements

- **FR-001** The summary of analytics MUST show the days of search as its first tile.
- **FR-002** The first day is the local calendar date of creation (005 FR-010) of the
  oldest application that exists now (005 FR-014). The last day is today. Both days
  count: days = today − first day + 1.
- **FR-003** The period filter (005 FR-030) MUST NOT change this number. The other
  tiles keep their period rule (005 FR-024).
- **FR-004** The number MUST use the local time zone (005 FR-012). As the other numbers
  of analytics, it MUST update when the data changes (005 FR-033) and each time the
  user opens analytics; then "today" is the date at that moment.
- **FR-005** An offer or a rejection does not stop the count.
- **FR-006** With no applications, analytics shows the empty state (005 FR-040); there
  is no tile.

## Non-functional requirements

- **NFR-001** The label is in English and Ukrainian; the number uses the locale format,
  as the other tiles.
- **NFR-002** The summary keeps working at the minimum window size of spec 001: the
  tiles wrap and do not overflow.

## Edge cases

- An application with a creation date in the future (import, spec 008): the first day
  is the oldest date; if it is after today, the tile shows 1.
- An import adds older applications: the tile counts from the oldest one.

## Out of scope

- A stop of the count on an offer.
- A date range of the search set by the user.
- The days of search through MCP or in the CSV export.

## Decisions

- **D-1** The first day is the creation date of the oldest application (owner,
  2026-11-26).
- **D-2** The number does not depend on the selected period (owner, 2026-11-26).
- **D-3** The count goes until today and never stops (owner, 2026-11-26).
- **D-4** It is a new tile, the first in the summary (owner, 2026-11-26).

## Open questions

- None.
