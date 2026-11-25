# Feature Spec: Delete stage history entries

- **ID:** 021-delete-stage-history
- **Status:** Implemented (0.7.1)
- **Approved:** 2026-11-24 (owner)
- **Author(s):** owner
- **Created:** 2026-11-24
- **Builds on:** [001-mvp-board](../001-mvp-board/spec.md) (FR-024), [005-analytics](../005-analytics/spec.md), [010-stale-applications](../010-stale-applications/spec.md)

## Summary

Each stage change of an application adds an entry to its stage history (001 FR-024).
Analytics (spec 005) counts these entries. When the user moves a card to the wrong
column by mistake and moves it back, both moves stay in the history. The wrong stage
then counts in "Stages over time", in the funnel and in the totals. Now the user cannot
correct this. With this feature, the user can delete an entry from the stage history in
the card details. Analytics then shows the corrected data.

## User stories

### US-1 — Delete a wrong entry (P1)

As a user, I want to delete a wrong entry from the stage history so that analytics
counts only the stages that really happened.

**Acceptance scenarios**

1. **Given** an application with the history "Applied → Technical interview →
   HR interview", **When** I delete "Technical interview" and confirm, **Then** the
   history is "Applied → HR interview" and the card stays in "HR interview".
2. **Given** the same application, **When** I delete "Technical interview", **Then**
   analytics counts no technical interview for it, and the funnel does not count it
   past "HR interview".
3. **Given** the confirmation dialog is open, **When** I select "Cancel" or press
   Escape, **Then** the history does not change.
4. **Given** the history has more than 5 entries and is collapsed, **When** I select
   "Show all", **Then** I can delete any entry, also an old one.

### US-2 — Delete the last entry (P1)

As a user, I want to delete the last entry so that a wrong move is corrected in one
step, and the card goes back to the stage where it was.

**Acceptance scenarios**

1. **Given** an application with the history "Applied → HR interview → Offer",
   **When** I delete "Offer" and confirm, **Then** the card moves to "HR interview",
   at the top of that column, and the history is "Applied → HR interview".
2. **Given** the same case, **Then** "in stage since" on the card shows the date of
   the "HR interview" entry, and the stale mark (spec 010) uses that date.

### US-3 — Equal entries next to each other merge (P1)

As a user, I want the history to show a stage only once when a delete puts two equal
stages next to each other, so that analytics does not count it twice.

**Acceptance scenarios**

1. **Given** the history "Applied (1 Nov) → HR interview (3 Nov) → Applied (3 Nov)",
   **When** I delete "HR interview", **Then** the history is "Applied (1 Nov)" only.
2. **Given** the same case, **Then** the card stays in "Applied" and "in stage since"
   shows 1 Nov.

### US-4 — The only entry stays (P2)

As a user, I must not be able to leave an application without a stage history.

**Acceptance scenarios**

1. **Given** an application with one history entry, **Then** the details show no
   delete action for it.

### US-5 — Keyboard (P1)

As a keyboard user, I want to delete an entry without a mouse.

**Acceptance scenarios**

1. **Given** the details of an application are open, **When** I press Tab, **Then**
   focus reaches the delete action of each entry, and a screen reader reads the stage
   and the date of that entry.
2. **When** I press Enter on it, **Then** the confirmation dialog opens; after it
   closes, focus goes to the history, not to the start of the window.

## Functional requirements

- **FR-001** In the stage history of the application details, the user MUST be able
  to delete each entry when the history has two or more entries.
- **FR-002** When the history has one entry, the delete action MUST NOT show.
- **FR-003** A delete MUST ask for confirmation first. The dialog names the stage and
  the date of the entry and tells that analytics will change. "Cancel" and Escape
  change nothing.
- **FR-004** After a delete, if two entries next to each other have the same stage,
  they MUST merge into one entry with the date of the earlier one. This repeats until
  no two neighbours have the same stage.
- **FR-005** The current stage of the application MUST always equal the stage of the
  last history entry (data model invariant). If a delete changes the last entry, the
  card MUST move to that stage and go to the top of its column (as 001 FR-023).
- **FR-006** If the current stage does not change, the card MUST keep its column and
  its position.
- **FR-007** A delete MUST change the "updated" time of the application. It MUST NOT
  change the creation time, the notes, the next step (spec 015) or other fields.
- **FR-008** A delete MUST NOT add a new history entry.
- **FR-009** After a delete, the board, the details, "in stage since", the stale mark
  (spec 010) and analytics (spec 005) MUST show the new history without a restart.
- **FR-010** A delete is one change: it is saved fully or not at all. If it fails, the
  user sees the error (spec 003) and the history stays as it was.
- **FR-011** CSV export (spec 008) MUST write the history after the delete.

## Non-functional requirements

- **NFR-001** Both languages: every new text is in English and Ukrainian; the date in
  the dialog uses the active locale.
- **NFR-002** Keyboard access and accessible names as in constitution §VIII: the delete
  action of each entry has a name with the stage and the date.
- **NFR-003** The history list does not get wider or move when the delete action
  shows; the details panel works at the minimum window size of spec 001.

## Edge cases

- Delete the first entry ("Applied") of "Applied → HR interview": the history is
  "HR interview". "Applications per day" still counts the application on its creation
  date (005 FR-010); the funnel counts it from "HR interview" back to "Applied" (005
  FR-023), as before.
- Delete the last entry when the entry before it is in a hidden column (spec 002): the
  card moves to the hidden stage and is not visible on the board until the user shows
  that column. The details stay open.
- Delete the last entry when the previous stage is "Offer": the card moves to "Offer".
  The question after an offer (spec 013) does not show again, because this is not a move
  by the user.
- An AI assistant (spec 004) changes the same application while the dialog is open:
  the delete uses the data that is saved at the moment of the delete. If the entry does
  not exist any more, the user sees an error and the history refreshes.
- Two entries with the same stage and time: each one can be deleted separately.

## Out of scope

- A change of the date or the stage of an entry.
- Delete of history entries through MCP (spec 004).
- An automatic note about the deleted entry.
- Undo after the confirmation.
- Automatic removal of quick back-and-forth moves.

## Success criteria

- **SC-001** After a wrong move and a move back, the user can make analytics correct
  again in three actions or fewer from the card details.
- **SC-002** Every number in analytics matches a manual count of the history after the
  delete in the test data.

## Decisions

- **D-1** Any entry can be deleted, also the last one; the only entry cannot. A delete
  of the last entry moves the card to the previous stage (owner, 2026-11-24).
- **D-2** Equal neighbours after a delete merge into one entry with the earlier date
  (owner, 2026-11-24).
- **D-3** A delete asks for confirmation in a dialog, as for notes and applications.
  No undo (owner, 2026-11-24).
- **D-4** Out of this spec: change of the entry date, delete through MCP, an
  automatic note (owner, 2026-11-24).

## Open questions

- None.
