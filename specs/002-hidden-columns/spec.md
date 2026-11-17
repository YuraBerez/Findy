# Feature Spec: Hidden columns

- **ID:** 002-hidden-columns
- **Status:** Implemented (0.1.0)
- **Created:** 2026-11-17
- **Approved:** 2026-11-17 (owner request)
- **Builds on:** [001-mvp-board](../001-mvp-board/spec.md)

## Summary

Not every stage matters to every job search: one user never has a C-level
interview, another does not want to see rejections every day. The user can hide
stage columns on the board and show them again later. A hidden column is not a
place where cards can go: no drag-and-drop, menu or form can move an application
into it.

## User stories

### US-1 — Hide a column (P1)

As a user, I want to hide columns that I do not use so that the board shows only
the stages that matter to me.

**Acceptance scenarios**

1. **Given** the board, **When** I click "Hide column" in a column header,
   **Then** the column disappears at once.
2. **Given** only one visible column, **Then** it cannot be hidden.
3. **Given** I hid columns, **When** I restart the app, **Then** they stay hidden.

### US-2 — Show hidden columns again (P1)

As a user, I want to see which columns are hidden and bring them back.

**Acceptance scenarios**

1. **Given** hidden columns, **When** I open "Columns…" in the app menu, **Then**
   I see every stage with a visibility switch and the number of applications in it.
2. **When** I turn a stage on, **Then** its column shows again in its normal place,
   with its applications.

### US-3 — No moves into hidden columns (P1)

As a user, I want cards to go only to visible columns, so that no card
disappears by mistake.

**Acceptance scenarios**

1. **Given** a hidden column, **When** I drag a card, **Then** I cannot drop it there.
2. **Given** a hidden column, **When** I move a card with the keyboard, **Then** the
   arrows skip the hidden column.
3. **Given** a hidden column, **Then** it is not offered in the card's "Move to"
   menu, in the stage list of "New application" or in the details panel.
4. **Given** "Applied" is hidden, **When** I add an application, **Then** the form
   starts with the first visible stage.

## Functional requirements

- **FR-001** Each column header MUST have a "Hide column" button. It MUST be
  disabled when only one column is visible.
- **FR-002** The app menu MUST have "Columns…", a dialog with one switch per stage,
  in board order, with the number of applications in that stage.
- **FR-003** The set of hidden stages MUST persist across restarts.
- **FR-004** Hiding a column MUST NOT change or delete its applications.
- **FR-005** Hidden stages MUST NOT be offered as a move target or a stage choice
  anywhere in the UI (drag-and-drop, keyboard, Move to menu, forms).
- **FR-006** The main process MUST reject creating or moving an application into a
  hidden stage (VALIDATION), and MUST reject hiding every stage.
- **FR-007** The default stage of a new application MUST be the first visible stage.

## Non-functional requirements

- **NFR-001** Both languages, keyboard access and WCAG 2.1 AA, as in spec 001.

## Edge cases

- A card whose stage gets hidden while its details panel is open: the panel stays
  open; its stage list still shows the current stage, so the form stays valid.
- Hidden stages and "Reset board" (001 US-10): reset keeps the column settings.

## Out of scope

- Renaming or reordering stages; custom stages.
- Showing the number of hidden applications on the board itself.

## Decisions

- **D-1** Hide from the column header; show again from "Columns…" in the app menu.
- **D-2** At least one column always stays visible.
- **D-3** Stored as a settings row `hiddenStages` (JSON array); no schema migration.
