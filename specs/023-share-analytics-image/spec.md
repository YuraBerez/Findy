# Feature Spec: Share analytics as an image

- **ID:** 023-share-analytics-image
- **Status:** Approved
- **Approved:** 2026-11-28 (owner)
- **Author(s):** owner
- **Created:** 2026-11-28
- **Builds on:** [005-analytics](../005-analytics/spec.md) (FR-015, FR-022, FR-024, FR-030),
  [022-search-days](../022-search-days/spec.md), [003-error-handling](../003-error-handling/spec.md)
- **Changes:** 005 "Out of scope" excluded the export of charts as an image. This spec adds
  one image for a post; the export of each chart and of CSV statistics stays out of scope.

## Summary

Users write posts about their job search on LinkedIn and other social networks. Today
they must take a screenshot of the analytics screen by hand, with the buttons and
filters on it, and crop it. A new button on the analytics screen makes a square image for
a post: the title "Findy", the selected period, the summary tiles and the funnel, the
Findy logo and the website address. The user sees a preview, and then copies the image or
saves it as a PNG file. The image is also free promotion of Findy in each post.

## User stories

### US-1 — Make an image of my analytics (P1)

As a user, I want to make an image of my analytics with one click so that I can add it to
a post about my job search.

**Acceptance scenarios**

1. **Given** analytics is open with applications, **Then** a "Share image" button shows on
   the right side of the period and grouping filters.
2. **When** I click it, **Then** a preview dialog opens with a square image that shows:
   the Findy logo and the title "Findy", the selected period, the summary tiles (days of
   search, applications sent, interviews, offers) and the funnel with numbers
   and percentages.
3. **Given** the period "Last 90 days", **Then** the image shows "Last 90 days" and the
   numbers of that period, the same as the screen.
4. **Given** the app is in the dark theme, **Then** the image is light.
5. **Given** the app language is Ukrainian, **Then** all text on the image is Ukrainian.
6. **Then** the bottom of the image shows the address of the Findy website.

### US-2 — Copy or save the image (P1)

As a user, I want to copy the image or save it as a file so that I can paste it into a
post or attach it.

**Acceptance scenarios**

1. **Given** the preview is open, **When** I click "Copy", **Then** the image goes to the
   clipboard and the app shows a short confirmation. In LinkedIn, Ctrl+V (Cmd+V) pastes it.
2. **When** I click "Save as PNG", **Then** the system save dialog opens with the name
   `findy-analytics-<date>.png`; after I confirm, the file is saved.
3. **When** I cancel the save dialog, **Then** nothing is saved, no error shows, and the
   preview stays open.
4. **When** the copy or the save fails, **Then** the app shows the error (spec 003) and
   the preview stays open.
5. **When** I press Esc or click "Close", **Then** the preview closes and focus goes back
   to the "Share image" button.

### US-3 — Use it with the keyboard (P2)

As a keyboard user, I want to make, copy and save the image without a mouse.

**Acceptance scenarios**

1. **Given** focus is on the filters, **When** I press Tab, **Then** focus moves to
   "Share image"; Enter or Space opens the preview.
2. **Given** the preview is open, **Then** focus is in the dialog, and Tab moves between
   "Copy", "Save as PNG" and "Close".

## Functional requirements

### Button

- **FR-001** The analytics screen MUST show a "Share image" button on the right side of
  the period and grouping filters, in the same row.
- **FR-002** With no applications, analytics shows the empty state (005 FR-040) and MUST
  NOT show the button.
- **FR-003** The button MUST have an accessible name and work with Tab, Enter and Space.

### Image content

- **FR-010** The image MUST be a square of 1080 × 1080 pixels in PNG format.
- **FR-011** The image MUST show, from top to bottom: the Findy logo and the title
  "Findy" with the subtitle "My job search"; the selected period (005 FR-030); the
  summary tiles in the order of the screen (022 FR-001, 005 FR-024) without
  "Rejections"; the funnel
  (005 FR-022); the address of the Findy website.
- **FR-012** All numbers on the image MUST be the same as on the analytics screen at the
  moment of the click: the same period, the same rules for hidden columns (005 FR-015).
  The days of search do not depend on the period (022 FR-003).
- **FR-013** The image MUST NOT show the period and grouping filters, buttons, the
  charts "Applications per day" and "Stages over time", or any name of a company,
  vacancy, note or person.
- **FR-014** The image MUST always use the light theme, independent of the app theme.
- **FR-015** All text on the image MUST be in the active app language; numbers,
  percentages and dates MUST use the active locale (constitution §V).
- **FR-016** Long labels (for example, Ukrainian stage names) MUST fit on the image
  without a cut or an overlap.

### Preview and actions

- **FR-020** A click on the button MUST open a modal preview dialog with the image and
  the buttons "Copy", "Save as PNG" and "Close".
- **FR-021** "Copy" MUST put the image in the system clipboard as an image and show a
  short confirmation.
- **FR-022** "Save as PNG" MUST open the system save dialog with the default name
  `findy-analytics-YYYY-MM-DD.png` (today's local date) and save the image to the
  selected path. A cancel of the dialog is not an error.
- **FR-023** A failure of the copy or the save MUST show an error (spec 003). The
  preview stays open.
- **FR-024** Esc and "Close" MUST close the preview and return focus to the button.
- **FR-025** The image MUST be made from the data at the moment of the click. A change
  of the data while the preview is open does not change the image.

## Non-functional requirements

- **NFR-001** Both languages, as in spec 001: every new string in English and Ukrainian.
- **NFR-002** Keyboard access and WCAG 2.1 AA in both themes for the button and the
  preview, as in spec 001. The text on the image has a contrast of at least 4.5 : 1.
- **NFR-003** With 1 000 applications, the preview MUST open in less than 1 second.
- **NFR-004** Privacy: the image is made on the computer. The app sends nothing to a
  network and opens no social network (constitution §II). The user decides where the
  image goes.
- **NFR-005** It MUST work on Windows, macOS and Linux (constitution §IV): the copied
  image pastes into a browser on each platform.

## Edge cases

- Applications exist, but none in the period: the image shows zeros in the period tiles
  and the funnel, and the days of search.
- All funnel stages are in hidden columns: the image shows the tiles and no funnel rows,
  as the screen does.
- Large numbers (for example, 1 000 applications): the tiles show them in the locale
  format and do not overflow.
- The user changes the app language while the preview is open: the open image does not
  change; the next one uses the new language.
- The save path is not writable: the app shows the error (FR-023).

## Out of scope

- The charts "Applications per day" and "Stages over time" on the image.
- Other sizes and formats (landscape, portrait, JPEG, SVG).
- A dark image or a theme switch in the preview.
- Text that the user writes on the image, or a custom title.
- A direct publication to LinkedIn or another social network.
- The export of each chart, and CSV export of statistics.

## Success criteria

- **SC-001** From the analytics screen, a user can put the image in a LinkedIn post in
  three actions or fewer: click "Share image", click "Copy", paste.
- **SC-002** Every number on the image matches the analytics screen for the same data.

## Decisions

- **D-1** The image is a separate card for a post, not a screenshot of the screen: title,
  period, summary tiles and funnel (owner, 2026-11-28).
- **D-2** A click opens a preview with "Copy" and "Save as PNG" (owner, 2026-11-28).
- **D-3** Square, 1080 × 1080 (owner, 2026-11-28).
- **D-4** The image has the Findy logo and the website address (owner, 2026-11-28).
- **D-5** The button is on the right side of the filters (owner, 2026-11-28).
- **D-6** The image is always light (owner, 2026-11-28).
- **D-7** The image uses the active app language (constitution §V).
- **D-8** The image has no "Rejections" tile; the screen keeps it (owner, 2026-11-28).

## Open questions

- None.
