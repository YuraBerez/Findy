# Feature Spec: Card colours

- **ID:** 007-card-colors
- **Status:** Approved
- **Approved:** 2026-11-18 (owner)
- **Created:** 2026-11-18
- **Builds on:** [001-mvp-board](../001-mvp-board/spec.md), [002-hidden-columns](../002-hidden-columns/spec.md) (card menu), [003-error-handling](../003-error-handling/spec.md)

> Describe WHAT users need and WHY. No implementation details (no libraries,
> file names, APIs).

## Summary

On a full board, all cards look the same. The user wants to mark some
applications so that they are easy to find: a favourite company, an urgent
reply, a "maybe" offer. The user can give a card one colour from a fixed palette
of 7 colours, or remove the colour. The colour has no meaning for the app. The
user decides what each colour means.

## User stories

### US-1 — Colour a card from its menu (P1)

As a user, I want to colour a card from its ⋯ menu so that I can mark it in two
clicks without opening it.

**Acceptance scenarios**

1. **Given** a card, **When** I open its ⋯ menu, **Then** I see the item "Colour"
   with the current colour next to it ("None" if the card has no colour).
2. **When** I select "Colour", **Then** the menu shows the 7 colours and "None",
   each with a colour sample and a name, and the current choice is marked.
3. **When** I select a colour, **Then** the menu closes and the card shows that
   colour at once.
4. **When** I select "None", **Then** the card shows no colour.
5. **Given** I coloured cards, **When** I restart the app, **Then** the cards keep
   their colours.
6. **Given** a keyboard only, **When** I open the menu and the "Colour" panel with
   the keys, **Then** I can select every option and go back without a mouse.

### US-2 — Colour a card in its details panel (P2)

As a user, I want to see and change the colour in the details panel so that I can
set it together with the other fields.

**Acceptance scenarios**

1. **Given** the details panel of an application, **Then** it shows the same
   choice of 7 colours and "None", with the current colour selected.
2. **When** I change the colour there, **Then** the card on the board shows the
   new colour.

### US-3 — Colour stays with the card (P1)

As a user, I want the colour to stay when I work with the card, so that I do not
lose my mark.

**Acceptance scenarios**

1. **Given** a coloured card, **When** I move it to another stage (drag-and-drop,
   keyboard or "Move to"), **Then** it keeps its colour.
2. **Given** a coloured card, **When** I edit its title, company, link or notes,
   **Then** it keeps its colour.
3. **Given** a new application, **Then** it has no colour.

## Functional requirements

- **FR-001** An application MUST have an optional colour: one of `red`, `orange`,
  `yellow`, `green`, `blue`, `purple`, `grey`, or no colour. The default is no
  colour.
- **FR-002** The card ⋯ menu MUST have a separate item "Colour" that shows the
  current colour name. It opens a panel with "None" and the 7 colours, in the
  order of FR-001, with the current choice marked.
- **FR-003** Each option MUST show a colour sample and the colour name in the
  active language.
- **FR-004** Selecting an option MUST save the colour at once and update the card.
  An error MUST show as in spec 003.
- **FR-005** A coloured card MUST show a soft tint of its colour on the whole card
  and a border in that colour. Text, links and icons on the card MUST stay
  readable in the light and the dark theme.
- **FR-006** The colour MUST persist across restarts and MUST NOT change when the
  card moves or when its other fields or notes change.
- **FR-007** The details panel MUST show the colour choice of FR-002 and FR-003
  and MUST save a change as in FR-004.
- **FR-008** A colour change MUST NOT add a stage history entry and MUST NOT
  change the card's position.
- **FR-009** The main process MUST reject a colour that is not in FR-001
  (VALIDATION).
- **FR-010** The accessible name of a coloured card MUST include the colour name,
  so the colour is not only a visual signal.
- **FR-011** Existing applications MUST have no colour after the update.

## Non-functional requirements

- **NFR-001** Both languages, keyboard access and WCAG 2.1 AA (text contrast on
  every tint in both themes), as in spec 001.
- **NFR-002** The tint MUST NOT hide the focus ring or the drag state of a card.

## Edge cases

- A card in a hidden column (spec 002) keeps its colour. It shows again when the
  column shows again.
- "Reset board" (001 US-10) deletes the applications together with their colours.
- The details panel is open and the colour changes from the card menu: the panel
  shows the new colour.
- The MCP server (spec 004) changes a card's fields: the colour does not change.
- A card is dragged: the drag overlay shows the same colour as the card.

## Out of scope

- Custom colours, a colour picker, or more than 7 colours.
- Names or meanings for colours set by the user.
- Filtering or sorting the board by colour.
- Reading or setting the colour through the MCP server (spec 004).
- Colour in analytics (spec 005).

## Success criteria

- **SC-001** A user can colour a card from its ⋯ menu in 3 actions or fewer
  (open menu, open "Colour", select).
- **SC-002** All text on every tint in both themes meets WCAG 2.1 AA contrast.

## Decisions

- **D-1** Look: a soft tint of the whole card plus a border in the colour (not a
  stripe, not a saturated fill), so text stays readable in both themes.
- **D-2** Where to choose: a separate "Colour" item in the card ⋯ menu (the main
  path, like "Move to"), and the same choice in the details panel.
- **D-3** Palette: red, orange, yellow, green, blue, purple, grey, plus "None".
  Each colour has a translated name.
- **D-4** No MCP support, no filter and no user names for colours in this spec.
  A later spec can add them.

## Open questions

None.
