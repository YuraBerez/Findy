# Feature Spec: Update check

- **ID:** 006-update-check
- **Status:** Implemented (0.2.0)
- **Created:** 2026-11-18
- **Approved:** 2026-11-18 (owner)
- **Builds on:** [001-mvp-board](../001-mvp-board/spec.md) (FR-070…FR-072, NFR-001), [003-error-handling](../003-error-handling/spec.md)
- **Needs:** a constitution amendment to §II (see D-1)

## Summary

Findy has no auto-update, so users keep old versions and do not get fixes. The app can
ask the project's public release list if a newer version exists, and show a popup with a
link to download it. The user starts each check: once by a menu item, or always by
turning on an automatic check. The automatic check is off by default, because Findy
makes no network requests without the user's consent (constitution §II). This spec
only tells the user about a new version. It does not download or install it.

## User stories

### US-1 — Check for updates by hand (P1)

As a user, I want to check if a newer version exists so that I can get fixes.

**Acceptance scenarios**

1. **Given** a newer version is published, **When** I select "Check for updates…" in
   the app menu, **Then** a popup says "Version X.Y.Z is available (you have A.B.C)"
   with the buttons "Download" and "Later".
2. **Given** I have the newest version, **When** I check, **Then** a message says that
   I have the latest version.
3. **Given** no internet connection, **When** I check, **Then** an error message says
   that the check failed, and the app works as before.
4. **When** I click "Download", **Then** the release page of that version opens in the
   system browser, and the popup closes.

### US-2 — Automatic check (P1)

As a user, I want the app to check for updates by itself, after I allow it.

**Acceptance scenarios**

1. **Given** a new installation, **Then** the app makes no update check until I turn
   on "Check for updates automatically" in the app menu.
2. **Given** the automatic check is on, **When** the app starts and the last check was
   24 hours ago or more, **Then** the app checks once.
3. **Given** the last check was less than 24 hours ago, **When** the app starts,
   **Then** it does not check.
4. **Given** a newer version, **When** the automatic check finds it, **Then** the popup
   of US-1.1 shows.
5. **Given** I click "Later", **Then** the popup closes, and the next automatic check
   (24 hours or more later) shows it again if the version is still newer.
6. **Given** no internet connection or another error, **When** the automatic check
   fails, **Then** nothing shows, and the app tries again at the next start.
7. **Given** I turn the automatic check off, **Then** the app makes no more checks
   until I turn it on again or check by hand.

## Functional requirements

- **FR-001** The app menu MUST have "Check for updates…". It works also when the
  automatic check is off.
- **FR-002** The app menu MUST have the switch "Check for updates automatically".
  Default: off. The choice MUST persist across restarts.
- **FR-003** The app MUST NOT make any network request for updates unless the user
  selects FR-001 or turns on FR-002.
- **FR-004** With FR-002 on, the app MUST check at start only when the last successful
  or failed check was 24 hours ago or more. The time of the last check MUST persist.
- **FR-005** A check MUST read the latest stable release of the project's public
  release page. Drafts and pre-releases MUST NOT count.
- **FR-006** A release is newer when its version is greater than the app version by
  Semantic Versioning order. An invalid version in the release MUST count as "no
  update".
- **FR-007** The popup MUST show the new version and the current version, and the
  buttons "Download" and "Later". Escape and a click outside close it as "Later".
- **FR-008** "Download" MUST open the release page of the new version in the system
  browser (http/https only, as in spec 001 FR-015).
- **FR-009** A manual check MUST show a result: the popup, "You have the latest
  version", or an error message (spec 003).
- **FR-010** An automatic check MUST NOT show an error. It MUST NOT delay the start
  of the app or block the board.
- **FR-011** A check MUST send no user data: no applications, notes, settings,
  identifiers or usage data. It is one anonymous request for public release data.
- **FR-012** A check MUST end after 10 seconds without an answer, as an error.

## Non-functional requirements

- **NFR-001** Both languages, keyboard access and WCAG 2.1 AA in both themes, as in
  spec 001.
- **NFR-002** Windows, macOS and Linux behave the same (constitution §IV).
- **NFR-003** Security: the renderer makes no network request; the main process
  makes the request and validates the answer (constitution §III).

## Edge cases

- The app runs from a development build with a version like `0.0.0`: the check works
  as for any other version.
- The release page answers with a rate-limit error: same as any other error.
- The answer is not valid or very large: "no update" for an automatic check, an error
  for a manual check.
- A manual check while the popup is open: no second popup.
- A newer version is found while a dialog is open: the popup waits until the dialog
  closes.
- The computer clock goes back: a "last check" in the future counts as 24 hours ago.

## Out of scope

- Download or installation of the update by the app (a later spec; macOS needs code
  signing first).
- Release notes in the popup.
- "Skip this version".
- Checks while the app runs (only at start).
- Beta or pre-release channels.

## Success criteria

- **SC-001** With the automatic check off, a network monitor shows no request from
  Findy during a full session.
- **SC-002** A user who turned on the automatic check sees a new version within one
  start after 24 hours from its release.

## Decisions

- **D-1** The update check is a second exception to constitution §II.1/§II.3 ("no
  network requests"). It needs an amendment, §II.6, in a separate PR with the
  `constitution` label: "The app may ask the project's public release page for the
  latest version, only after the user starts the check or turns on the automatic
  check (off by default). It sends no user data." (owner, 2026-11-18)
- **D-2** Stage 1 only: tell the user, link to the download. No auto-install
  (owner, 2026-11-18).
- **D-3** The automatic check is off by default; the user turns it on in the app menu.
  No question at first start (owner, 2026-11-18).
- **D-4** At start, at most once per 24 hours (owner, 2026-11-18).
- **D-5** The popup shows only the versions, with "Download" and "Later"
  (owner, 2026-11-18).

## Open questions

- None.
