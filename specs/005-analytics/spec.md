# Feature Spec: Analytics

- **ID:** 005-analytics
- **Status:** Approved
- **Created:** 2026-11-18
- **Approved:** 2026-11-18 (owner)
- **Builds on:** [001-mvp-board](../001-mvp-board/spec.md), [002-hidden-columns](../002-hidden-columns/spec.md)

## Summary

The board shows where each application is now. It does not show how the job search
goes over time. The user wants to see this: how many applications they send per day,
how many interviews they get, and how many applications reach each stage. A second
screen, "Analytics", shows charts and totals for a period that the user selects. The
user switches between "Board" and "Analytics" with tabs. All values come from the data
that Findy already keeps: the creation time of each application and its stage history.

## User stories

### US-1 — Switch between the board and analytics (P1)

As a user, I want two tabs, "Board" and "Analytics", so that I can open my statistics
and go back to the board quickly.

**Acceptance scenarios**

1. **Given** the app is open, **Then** the toolbar shows the tabs "Board" and
   "Analytics", and "Board" is selected.
2. **When** I click "Analytics", **Then** the analytics screen replaces the board.
3. **Given** focus is on a tab, **When** I press Left or Right, **Then** focus and
   selection move to the other tab.
4. **When** I press Ctrl+1 (Cmd+1 on macOS), **Then** the board opens; Ctrl+2 (Cmd+2)
   opens analytics.
5. **Given** analytics is open, **When** I go back to the board, **Then** the board
   keeps its search text and scroll position.

### US-2 — Applications per day (P1)

As a user, I want to see how many applications I sent on each day so that I can see
if I keep a steady pace.

**Acceptance scenarios**

1. **Given** I created 3 applications today and 2 yesterday, **When** I open analytics
   with the period "Last 7 days", **Then** the chart shows 3 for today, 2 for
   yesterday and 0 for the other 5 days.
2. **Given** the period "Last 90 days" and grouping "Week", **Then** each bar shows the
   number of applications that were created in that week.
3. **Given** a day with no applications, **Then** the chart shows it as 0, not as a gap.

### US-3 — Stages over time (P1)

As a user, I want to see how many HR, technical and other interviews I had in each
period so that I can see the trend.

**Acceptance scenarios**

1. **Given** an application moved to "Technical interview" on Monday, **Then** the
   chart counts 1 technical interview for Monday.
2. **Given** an application moved to "Technical interview", then back, then to
   "Technical interview" again, **Then** the chart counts 2 entries, one on each date.
3. **Given** I select which stages to show, **Then** the chart shows only those stages.

### US-4 — Funnel (P1)

As a user, I want to see how many applications reached each stage, and the percentage,
so that I know where my search stops.

**Acceptance scenarios**

1. **Given** 40 applications in the period: 10 reached HR interview, 4 reached
   technical interview, 1 reached an offer, **Then** the funnel shows 40 → 10 → 4 → 1
   and the percentage of the first stage for each row (100 %, 25 %, 10 %, 2.5 %).
2. **Given** an application moved from "Applied" directly to "Technical interview",
   **Then** it counts for "HR interview" and "Test task" too, because it went past them.
3. **Given** an application that was rejected after the HR interview, **Then** it counts
   for "Applied" and "HR interview" in the funnel and in the number of rejections.

### US-5 — Totals (P2)

As a user, I want a few large numbers at the top so that I get the main facts quickly.

**Acceptance scenarios**

1. **Given** a period, **Then** the screen shows: applications sent, interviews
   (HR, technical and C-level entries), offers and rejections in that period.

### US-6 — Period and grouping (P1)

As a user, I want to select the period and how to group it so that I can see short
and long trends.

**Acceptance scenarios**

1. **Given** analytics opens for the first time, **Then** the period is "Last 30 days"
   and the grouping is "Day".
2. **When** I select "Last 7 days", "Last 30 days", "Last 90 days" or "All time",
   **Then** all charts and totals use that period.
3. **When** I select "Day", "Week" or "Month", **Then** the time charts group by it.
4. **Given** I changed the period or the grouping, **When** I restart the app, **Then**
   analytics opens with the same period and grouping.

### US-7 — No data (P2)

As a user with an empty board, I want a clear message instead of empty charts.

**Acceptance scenarios**

1. **Given** no applications, **When** I open analytics, **Then** I see a message that
   there is no data yet and a button that opens the board.
2. **Given** applications exist, but none in the selected period, **Then** the charts
   show zeros and a short note "No activity in this period".

## Functional requirements

### Navigation

- **FR-001** The toolbar MUST show two tabs, "Board" and "Analytics". The board is the
  default tab when the app starts.
- **FR-002** The tabs MUST work with the keyboard: Tab moves focus to the selected tab,
  Left and Right change the tab. Ctrl/Cmd+1 opens the board, Ctrl/Cmd+2 opens analytics.
- **FR-003** A change of tab MUST NOT reset the board state: search text, scroll
  position and an open details panel stay as they were.
- **FR-004** Board actions that need the board (search, "New application") MUST be
  hidden or disabled while analytics is open.

### Data rules

- **FR-010** The date of an application is the local calendar date of its creation
  time. Analytics MUST NOT use a separate "date sent".
- **FR-011** A stage entry is an item in the stage history of an application. Its date
  is the local calendar date of the entry. The first entry of each application counts
  too.
- **FR-012** All days, weeks and months MUST use the local time zone of the computer.
  A week starts on Monday.
- **FR-013** The period "Last N days" MUST include today and the N − 1 days before it.
  "All time" starts on the date of the oldest application.
- **FR-014** Analytics MUST use only the applications that exist now. Deleted
  applications are not counted, because their history is deleted with them.
- **FR-015** Stages of hidden columns (spec 002) MUST NOT show in the stages chart and
  in the funnel. They still count in "Applications per day" and in the totals.

### Charts and totals

- **FR-020** "Applications per day" MUST show one bar per day, week or month of the
  period, with the number of applications created in it. Empty buckets show 0.
- **FR-021** "Stages over time" MUST show, for each bucket, the number of stage entries
  per stage. The user MUST be able to turn each stage on and off in the chart legend.
- **FR-022** The funnel MUST use the applications created in the period. For each
  stage from "Applied" to "Offer", in board order, it MUST show the number of
  applications that reached this stage or a later stage, and the percentage of the
  first row.
- **FR-023** "Reached" in FR-022 means: the stage history has an entry for this stage
  or for a later stage. Every application reached "Applied", also one that was created
  in "Rejected". "Rejected" is not a funnel step; it is a separate number: the
  applications of the period with a "Rejected" entry.
- **FR-024** The totals MUST show for the period: applications sent (FR-020), interviews
  (stage entries for HR, technical and C-level interview), offers and rejections
  (stage entries for "Offer" and "Rejected").
- **FR-025** Each chart MUST show the exact value of a bar or point on hover and on
  keyboard focus.
- **FR-026** Each chart MUST have a "Show as table" option with the same numbers in an
  accessible table.

### Period and grouping

- **FR-030** The user MUST be able to select the period: last 7 days, last 30 days,
  last 90 days, all time. Default: last 30 days.
- **FR-031** The user MUST be able to select the grouping: day, week, month. Default: day.
- **FR-032** The period and grouping MUST persist across restarts.
- **FR-033** Analytics MUST update when the data changes, also when the change comes
  from an AI assistant (spec 004), without a restart.

### Empty state

- **FR-040** With no applications, analytics MUST show an empty-state message and a
  button that opens the board.
- **FR-041** With applications, but none in the period, the charts MUST show zeros
  and the note "No activity in this period".

## Non-functional requirements

- **NFR-001** Both languages, as in spec 001. Dates, numbers and percentages use the
  active locale; Ukrainian plurals are correct.
- **NFR-002** Keyboard access and WCAG 2.1 AA in both themes, as in spec 001. Colour is
  never the only signal: each series has a label in the legend and in the table.
- **NFR-003** With 1 000 applications and 10 000 stage entries, analytics MUST open and
  update after a change of period in less than 300 ms.
- **NFR-004** Privacy: analytics is calculated on the computer only. No data leaves the
  computer (constitution §II).
- **NFR-005** The analytics screen MUST work at the minimum window size of spec 001:
  the charts shrink or the screen scrolls vertically, without horizontal scroll.

## Edge cases

- One application only: the funnel shows 1 → 0 → … with 100 % and 0 %.
- An application created today in "Technical interview": it counts in applications
  per day, in the funnel up to "Technical interview", and as one technical interview.
- A move back to an earlier stage does not remove the later stage from the funnel.
- An application that reached an offer and then was rejected counts as an offer and
  as a rejection.
- "All time" with 2 years of data and grouping "Day": the chart can show more than
  700 bars. It scrolls or thins the axis labels; it does not freeze.
- The date changes at midnight while analytics is open: the next update uses the new
  "today".
- The computer time zone changes: buckets are calculated again with the new zone.
- Reset board (001 US-10): analytics shows the empty state.

## Out of scope

- A separate "date sent" field and a change of the creation date.
- A custom date range with a calendar.
- Export of charts or statistics (image, CSV).
- Goals and reminders ("send 5 applications per day").
- Statistics for notes, companies or time spent in each stage.
- Analytics through MCP (spec 004).

## Success criteria

- **SC-001** A user can see how many applications they sent last week in two clicks
  or fewer from the board.
- **SC-002** Every number on the analytics screen matches a manual count from the
  stage history in the test data.

## Decisions

- **D-1** Analytics is a separate screen. The user opens it from the tabs "Board |
  Analytics" in the toolbar, not from a dialog or a side panel (owner, 2026-11-18).
- **D-2** First version: applications per day, stages over time, funnel with
  percentages, totals (owner, 2026-11-18).
- **D-3** The date of an application is its creation date. No new field and no
  schema change (owner, 2026-11-18).
- **D-4** Period presets 7 / 30 / 90 days / all time, with grouping day / week /
  month (owner, 2026-11-18).
- **D-5** One analytics page with all charts. No sub-tabs (owner, 2026-11-18).
- **D-6** Funnel counts "reached this stage or a later stage"; rejections are a
  separate number (owner, 2026-11-18).
- **D-7** Stages of hidden columns are not shown in the stages chart and the funnel
  (owner, 2026-11-18).

## Open questions

- None.
