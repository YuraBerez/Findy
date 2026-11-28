# Feature Spec: Browser extension in the settings

- **ID:** 024-extension-settings
- **Status:** Implemented (0.9.0)
- **Approved:** 2026-11-28 (owner)
- **Author(s):** owner
- **Created:** 2026-11-28
- **Builds on:** [018-settings](../018-settings/spec.md) (FR-001, FR-005),
  [019-browser-extension](../019-browser-extension/spec.md) (D-8),
  [020-website](../020-website/spec.md) (the guide pages)

## Summary

Findy has a browser extension (spec 019), but the app does not tell the user about it.
The user finds it only in the README or on the website. A new category "Browser
extension" in the settings window says what the extension does, and gives buttons to
download the extension of this version and to open the install guide. The extension is
not in the browser stores yet, so the user loads it from the downloaded file.

## User stories

### US-1 — Find the extension in the app (Priority: P1)

As a user, I want to see the browser extension in the settings so that I know that it
exists and what it does.

**Acceptance scenarios**

1. **Given** the settings window is open, **Then** the side list shows "Browser
   extension" as the last category, after "AI assistant".
2. **When** I select it, **Then** the page shows a short text: the extension adds the
   vacancy of the open page to the board in one click, and it talks only to Findy on this
   computer.

### US-2 — Download and install the extension (Priority: P1)

As a user, I want to download the extension of my Findy version and read how to install
it so that I can start to use it.

**Acceptance scenarios**

1. **Given** Findy 0.8.0, **When** I click "Download for Chrome, Edge and others", **Then**
   the system browser opens the file `Findy-0.8.0-browser-extension.zip` of the 0.8.0
   release.
2. **When** I click "Download for Firefox", **Then** the system browser opens the file
   `Findy-0.8.0-browser-extension-Firefox.zip` of the same release.
3. **Given** the app language is English, **When** I click "How to install", **Then** the
   system browser opens the English guide page of the browser extension on the website.
4. **Given** the app language is Ukrainian, **When** I click "Як встановити", **Then** the
   system browser opens the Ukrainian guide page.

### US-3 — Use it with the keyboard (Priority: P2)

As a keyboard user, I want to reach the category and its buttons without a mouse.

**Acceptance scenarios**

1. **Given** focus is on the side list, **When** I press the arrow keys, **Then** I can
   select "Browser extension" as the other categories (018 FR-005).
2. **Then** Tab moves to the three buttons, and Enter or Space opens each link.

## Functional requirements

- **FR-001** The settings window MUST have the category "Browser extension" as the last
  item of the side list (after "AI assistant", 018 FR-001). It follows the rules of the
  other categories (018 FR-005).
- **FR-002** The page MUST show a short description of the extension (spec 019): it adds
  the job title, the company and the link of the open vacancy to "Applied" in one click,
  and it talks only to the Findy app on this computer.
- **FR-003** The page MUST have the buttons "Download for Chrome, Edge and others" and
  "Download for Firefox". They MUST open, in the system browser, the extension files of
  the release of the running app version (019 D-8).
- **FR-004** The page MUST have the button "How to install". It MUST open, in the system
  browser, the browser extension guide on the website in the app language.
- **FR-005** The page MUST NOT check if the extension is installed or connected. Findy
  makes no new request (constitution §II).

## Non-functional requirements

- **NFR-001** Every new text in English and Ukrainian.
- **NFR-002** Keyboard access and WCAG 2.1 AA in both themes, as the other categories.
- **NFR-003** Links open only in the system browser, through the existing safe link rule
  (constitution §III.4).

## Edge cases

- A development build or a version without a release: the download buttons still open
  the files of that version; the browser shows the "not found" page of GitHub. No error in
  the app.
- The language changes while the page is open: the texts and the guide link follow at once
  (018 FR-014).
- The database cannot be opened: the settings window does not open (018 FR-004), so the
  page is not shown.

## Out of scope

- A status of the extension: installed, connected browsers, the last addition.
- Store buttons (Chrome Web Store, addons.mozilla.org): the extension is not in the stores
  yet. A later spec adds them.
- A download of the file by Findy itself, or install from the app.
- An "Add from the browser" mark on the board.

## Success criteria

- **SC-001** From the board, a user reaches the extension download in three clicks or
  fewer: ⋯ → Settings… → Browser extension → a download button.

## Decisions

- **D-1** The page has a description and buttons: two downloads and the guide; no status
  (owner, 2026-11-28).
- **D-2** It is a new category of the settings window, not a part of General (owner,
  2026-11-28).

## Open questions

- None.
