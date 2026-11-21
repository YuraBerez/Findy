# Feature Spec: One settings window

- **ID:** 018-settings
- **Status:** Approved
- **Approved:** 2026-11-21 (owner)
- **Author(s):** owner
- **Created:** 2026-11-21
- **Builds on:** [001-mvp-board](../001-mvp-board/spec.md) (language, theme),
  [002-hidden-columns](../002-hidden-columns/spec.md), [006-update-check](../006-update-check/spec.md),
  [010-stale-applications](../010-stale-applications/spec.md),
  [015-next-step](../015-next-step/spec.md) (reminders)
- **Replaces:** spec 001 FR-080 and FR-081 (the theme switch in the app menu), spec 002
  FR-002 ("Columns…" dialog), spec 006 FR-002 (the switch in the app menu), spec 010
  FR-008 (the "Stale after…" dialog), spec 015 FR-030 (the switch in the app menu)

## Summary

The app menu (⋯) has grown to about 15 items. Half of them are settings: the language,
the theme, reminders, the automatic update check, "Columns…" and "Stale after…". Each one
is useful, but together they make the menu long and hard to scan. This spec moves all
settings into one "Settings" window with sections. The menu keeps only actions. The
window opens from the menu, with the standard shortcut (Cmd+, on macOS, Ctrl+, on
Windows and Linux) and from the native application menu. A change applies and is saved
at once, as today.

## User stories

### US-1 — Open the settings (Priority: P1)

As a user, I want one place for all settings, so that I find a setting without reading
the whole menu.

**Acceptance scenarios**

1. **Given** the board, **When** I choose **⋯ → Settings…**, **Then** the "Settings"
   window opens with the sections General, Board, Reminders and Updates.
2. **When** I press Cmd+, (macOS) or Ctrl+, (Windows, Linux), **Then** the window opens.
3. **When** I choose **Settings…** in the native application menu (macOS: the Findy
   menu; Windows and Linux: the File menu), **Then** the window opens.
4. **Given** another dialog or the details panel is open, **When** I press the shortcut,
   **Then** nothing happens.
5. **When** I press Esc or **Close**, **Then** the window closes and the focus returns to
   where it was.

### US-2 — Change a setting (Priority: P1)

As a user, I want a change to apply at once, so that I see its effect without a save step.

**Acceptance scenarios**

1. **General:** **Given** the window, **When** I choose Українська, **Then** the whole
   app, the window and the native menu change to Ukrainian at once.
2. **General:** **When** I choose the theme System, Light or Dark, **Then** the app uses
   it at once. With System, the app follows the operating system, also while it runs.
3. **Board:** **When** I turn off the switch of a column, **Then** that column is hidden
   on the board at once. The last visible column cannot be turned off (spec 002).
4. **Board:** **When** I enter 7 days for "Stale after" and leave the field or press
   Enter, **Then** the stale marks use 7 days at once. **When** I enter 2, 91 or nothing,
   **Then** an error shows next to the field and the saved value stays.
5. **Reminders:** **When** I turn off Reminders, **Then** Findy shows no notifications
   (spec 015).
6. **Updates:** **When** I turn on "Check for updates automatically", **Then** the check
   runs at the next start (spec 006).
7. **Given** I changed settings, **When** I restart Findy, **Then** the window shows the
   same values.

### US-3 — A shorter menu (Priority: P1)

As a user, I want the app menu to hold only actions.

**Acceptance scenarios**

1. **Given** the app menu (⋯), **Then** it shows, in this order: Settings…, AI assistant
   access…, Export to CSV…, Import from CSV…, Check for updates…, Support Findy…, Reset
   board….
2. **Then** the menu has no language submenu, no theme switch, no reminders switch, no
   automatic update switch, no "Columns…" and no "Stale after…".

## Functional requirements

### Window

- **FR-001** Findy MUST have one "Settings" window (a dialog over the board) with these
  sections, in this order:
  - **General:** language (English, Українська), theme (System, Light, Dark).
  - **Board:** one switch per stage (shown or hidden), and "Stale after" with a number of
    days.
  - **Reminders:** the Reminders switch.
  - **Updates:** the "Check for updates automatically" switch.
- **FR-002** The window MUST open from **⋯ → Settings…**, with Cmd+, on macOS and Ctrl+,
  on Windows and Linux, and from **Settings…** in the native application menu (the Findy
  menu on macOS, the File menu on Windows and Linux). The shortcut MUST do nothing while
  another dialog or the details panel is open.
- **FR-003** The window MUST have a **Close** button and close with Esc. It MUST NOT
  have a Save button.
- **FR-004** When the database cannot be opened (spec 001 FR-054), **Settings…** MUST be
  turned off in both menus and the shortcut MUST do nothing.

### Settings

- **FR-010** Each change MUST apply and be saved at once, with the same rules and values
  as before this spec. The saved values do not change; an upgrade keeps them.
- **FR-011** The theme MUST offer System, Light and Dark. System follows the operating
  system, also when it changes while Findy runs. A user who chose Light or Dark before
  this spec keeps that choice.
- **FR-012** The column switches MUST follow spec 002: at least one column stays
  visible, and hiding a column does not change its applications. The "Hide column"
  button in a column header stays (spec 002 FR-001).
- **FR-013** "Stale after" MUST accept a whole number from 3 to 90 (spec 010 FR-008). It
  MUST save when the field loses focus or on Enter. An invalid value MUST show an error
  next to the field and MUST NOT be saved.
- **FR-014** A language change MUST change the window, the board and the native menu at
  once (spec 001 FR-044).

### App menu

- **FR-020** The app menu (⋯) MUST hold only actions, in this order: Settings…, AI
  assistant access…, Export to CSV…, Import from CSV…, Check for updates…, Support
  Findy…, Reset board…. Separators MAY group them.
- **FR-021** The "AI assistant access" dialog (spec 004, spec 016, spec 017) MUST stay a
  dialog of its own; it does not move into the window.

## Non-functional requirements

- **NFR-001** All new text in English and Ukrainian (constitution §V). Each language is
  named in itself (spec 001 FR-040).
- **NFR-002** Every control MUST work by keyboard and have an accessible name; the
  sections MUST be headings (constitution §VIII). WCAG 2.1 AA in both themes.
- **NFR-003** The window MUST fit 800 × 600 in Ukrainian without a horizontal scroll; its
  content scrolls when it is taller than the window.
- **NFR-004** No change to the stored data and no migration.

## Edge cases

- The last visible column: its switch is turned off (not available), with the reason
  next to it, as in the "Columns…" dialog of spec 002.
- The user types "7" in "Stale after" and presses Esc: the window closes and 7 is not
  saved, because the field did not lose focus or get Enter first.
- The theme was System and the user picks Dark: the app is dark; when the operating
  system changes to light, the app stays dark.
- The window is open and an AI assistant changes the board through MCP: the board
  reloads under the window; the window stays open.

## Out of scope

- New settings (for example, the reminder lead times or a default stage).
- Search in the settings.
- The AI assistant access dialog inside the window (D-3).
- A setting to show or hide the Sites tab.
- Settings for the job sites (spec 011): they stay on the Sites tab.

## Success criteria

- **SC-001** The app menu has 7 items or fewer.
- **SC-002** A user finds and changes any setting in under 10 seconds from the board.

## Decisions

- **D-1** The window opens from the ⋯ menu, with Cmd/Ctrl+, and from the native
  application menu (owner, 2026-11-21).
- **D-2** One window with sections, not tabs (owner).
- **D-3** AI assistant access stays a dialog of its own in the ⋯ menu (owner).
- **D-4** The theme is System, Light or Dark; the sun/moon switch goes away (owner).
- **D-5** Changes apply at once; no Save button (owner).
- **D-6** The ⋯ menu keeps only actions; language, theme, reminders, the automatic update
  check, "Columns…" and "Stale after…" move into the window (owner).

## Open questions

None.
