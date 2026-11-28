# Feature Spec: Card colours through the AI assistant

- **ID:** 025-mcp-card-colors
- **Status:** Implemented (0.9.0)
- **Approved:** 2026-11-28 (owner)
- **Author(s):** owner
- **Created:** 2026-11-28
- **Builds on:** [004-mcp-server](../004-mcp-server/spec.md) (FR-002, FR-003, FR-006, FR-008),
  [007-card-colors](../007-card-colors/spec.md), [016-mcp-skill](../016-mcp-skill/spec.md)
- **Changes:** 007 D-4 and its "Out of scope" excluded the colour from the MCP server. This
  spec lets an AI assistant read and set the colour of a card.

## Summary

The user marks cards with colours (spec 007), but an AI assistant cannot see or change
them. The user wants to ask the assistant, for example, "mark in red every application
with an interview this week" or "which applications are green?". The tools that add and
change an application get an optional colour, and the tools that read applications give
the colour.

## User stories

### US-1 — Colour cards through the assistant (Priority: P1)

As a user, I want my AI assistant to colour cards so that I can mark many applications
with one request.

**Acceptance scenarios**

1. **Given** AI assistant access is on, **When** the assistant changes an application
   with the colour "red", **Then** the card on the board is red within a second, without
   a restart.
2. **When** the assistant changes an application with the colour `null`, **Then** the card
   has no colour.
3. **When** the assistant adds an application with the colour "green", **Then** the new
   card is green.
4. **When** the assistant changes only the title, **Then** the colour does not change.
5. **When** the assistant sends a colour that does not exist, for example "pink", **Then**
   the tool gives an error that names the allowed colours, and nothing changes.

### US-2 — The assistant sees the colours (Priority: P1)

As a user, I want my AI assistant to see the colour of each card so that it can answer
questions about them.

**Acceptance scenarios**

1. **Given** a red card and a card with no colour, **When** the assistant lists the
   applications, **Then** the first has the colour "red" and the second `null`.
2. **When** the assistant gets one application, **Then** the result has its colour.

## Functional requirements

- **FR-001** `add_application` MUST accept an optional colour, one of the 7 colours of
  spec 007 (`red`, `orange`, `yellow`, `green`, `blue`, `purple`, `grey`). Without it, the
  card has no colour.
- **FR-002** `update_application` MUST accept an optional colour: one of the 7 colours
  sets it, `null` removes it, and no colour keeps it.
- **FR-003** `list_applications` and `get_application` MUST give the colour of each
  application: its id, or `null`.
- **FR-004** A colour that is not one of the 7 MUST give a validation error that lists the
  allowed colours (004 FR-008). The application does not change.
- **FR-005** The tools MUST use the same colour rule and data as the app (004 FR-003).
  A change of the fields and the colour in one call MUST be one transaction.
- **FR-006** The app MUST show a colour change from the assistant without a restart
  (004 FR-006).
- **FR-007** The skill for assistants (spec 016) MUST describe the colour field and the
  colour ids.

## Non-functional requirements

- **NFR-001** The tool descriptions and the skill are in English, as the other tools.
- **NFR-002** No new tool and no new network access; access stays off by default
  (constitution §II.5).

## Edge cases

- The application is in a hidden column (spec 002): the colour changes; the card shows it
  when the column shows again.
- The colour and another field in one call, and the other field is not valid: nothing
  changes.
- The same colour again: no error; the card stays the same.
- An application deleted meanwhile: the tool gives "not found", as the other tools.

## Out of scope

- Names or meanings for colours ("red means urgent").
- A filter of `list_applications` by colour.
- The colour in CSV export and import (spec 008).

## Success criteria

- **SC-001** With one request, the assistant colours several cards, and the board shows
  every change without a restart.

## Decisions

- **D-1** The colour is an optional field of `add_application` and `update_application`,
  not a separate tool (owner, 2026-11-28).
- **D-2** `list_applications` and `get_application` give the colour (owner, 2026-11-28).

## Open questions

- None.
