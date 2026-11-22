# Feature Spec: Add a vacancy from the browser

- **ID:** 019-browser-extension
- **Status:** Implemented (0.7.0)
- **Approved:** 2026-11-22 (owner)
- **Author(s):** owner
- **Created:** 2026-11-22
- **Builds on:** [001-mvp-board](../001-mvp-board/spec.md) (US-1, validation),
  [004-mcp-server](../004-mcp-server/spec.md) (a Findy process that the other program
  starts), [009-add-from-link](../009-add-from-link/spec.md) (rules that find the job
  title and the company), [014-application-fields](../014-application-fields/spec.md)
  (source from the link)
- **Needs:** a constitution amendment to §II (see D-1)

## Summary

The user finds vacancies in the browser. To add one to Findy, the user copies the link,
opens Findy and pastes it. For pages that need a login (for example LinkedIn), spec 009
cannot read the page, so the user also types the job title and the company. This spec
adds a Findy extension for the browser. On a vacancy page, the user clicks the extension
button. A small window shows the job title, the company and the link from the open page.
The user can correct them and clicks "Add to Findy". The application goes to the
"Applied" stage. The extension talks only to Findy on the same computer, through the
browser. It uses no network and no server.

## Glossary

| Term | Meaning |
|------|---------|
| **Extension** | The Findy add-on that the user installs from the store of the browser. |
| **Popup** | The small window that opens when the user clicks the extension button. |
| **Connector** | The Findy process that the browser starts for the extension. It talks only to the extension and stops after the request. |

## User stories

### US-1 — Add the open vacancy in one click (Priority: P1)

As a job seeker, I want to add the vacancy that I see in the browser to Findy with one
click, so that I do not copy the link and the fields by hand.

**Acceptance scenarios**

1. **Given** Findy and the extension are installed, **When** I open a vacancy page and
   click the extension button, **Then** the popup shows the job title, the company and
   the link of the page.
2. **When** the values are correct and I click "Add to Findy", **Then** Findy creates
   the application in "Applied", and the popup says that it is added.
3. **Given** the popup, **When** I change the job title or the company before I add,
   **Then** Findy saves my values.
4. **Given** Findy is open, **When** I add from the popup, **Then** the board shows the
   new card at once. **Given** Findy is closed, **Then** the card is on the board the
   next time that I open Findy.
5. **Given** the link is from a job site that Findy knows, **Then** the source of the
   application fills in as in spec 014.
6. **Given** a page that needs a login and that I am logged in to, **Then** the popup
   reads the page as I see it.

### US-2 — See that the vacancy is already in Findy (Priority: P1)

As a job seeker, I want to know that I already added this vacancy, so that I do not
add it twice.

**Acceptance scenarios**

1. **Given** an application with the same link, **When** I open the popup, **Then** the
   popup says "Already in Findy" and shows the stage of that application.
2. **When** I still want a new application, **Then** I click "Add anyway" and Findy
   creates it (duplicates are allowed, spec 001).
3. **Given** two or more applications with the same link, **Then** the popup shows the
   stage of the last updated one.

### US-3 — Clear messages when something is missing (Priority: P1)

**Acceptance scenarios**

1. **Given** Findy is not installed, or its version cannot talk to the extension,
   **When** I open the popup, **Then** the popup says so and gives a link to the Findy
   download page. The "Add to Findy" button is not available.
2. **Given** the page gives no job title or no company, **Then** that field is empty
   and the "Add to Findy" button is not available until I fill it in.
3. **Given** a page that is not `http`/`https` (a new tab, a settings page, a PDF that
   the browser shows), **Then** the popup says that it cannot add this page.
4. **Given** the save fails in Findy, **Then** the popup shows the reason, keeps my
   values, and I can try again.

### US-4 — Keyboard and both languages (Priority: P1)

1. **Given** a keyboard only, **Then** I can open the popup with the shortcut of the
   browser, move through the fields and add.
2. **Given** a browser in Ukrainian, **Then** the popup and the store page are in
   Ukrainian. For other languages, they are in English. The values from the page are as
   on the page.

## Functional requirements

- **FR-001** The extension MUST read the open page only when the user clicks its button.
  It MUST read only the active tab.
- **FR-002** The extension MUST find the job title and the company with the rules of
  spec 009 FR-004, applied to the page as the browser shows it. The values MUST follow
  the limits of spec 001 (200 characters).
- **FR-003** The popup MUST show the job title, the company and the link. The job title
  and the company MUST be editable. The link MUST be the address of the open page.
- **FR-004** "Add to Findy" MUST create one application in the "Applied" stage with the
  job title, the company and the link from the popup. The same validation as in spec
  001 applies. The source fills in as in spec 014.
- **FR-005** "Add to Findy" MUST be available only when the job title and the company
  are not empty and Findy answers.
- **FR-006** When the popup opens, the extension MUST ask Findy for applications with the
  same link. If there is one, the popup MUST show "Already in Findy" and its stage, and
  the button "Add anyway" in place of "Add to Findy".
- **FR-007** For the duplicate check, Findy MUST compare links without these parts:
  the letter case of the host, a slash at the end of the path, the part after `#`, and
  tracking parameters of the query (`utm_*`, `ref`, `trk` and similar). Other query
  parameters MUST count, because some job sites keep the vacancy id in the query. The
  stored link does not change.
- **FR-008** The connector MUST give the extension only these data: the result of an
  add, the stage of an application with the same link, and the version of Findy. It MUST
  NOT give other fields, notes or the list of applications.
- **FR-009** The connector MUST save even when the Findy app is closed. The open app MUST
  show a change from the connector at once, as for spec 004.
- **FR-010** When the connector cannot start, or it answers with an unknown version, the
  popup MUST show the message of US-3.1 with a link to the download page of the project.
- **FR-011** Every start of the Findy app MUST register the connector with each
  supported browser that is installed. This covers the first start and every update.
  There is no setting to turn it off (D-3, D-11).
- **FR-012** The extension MUST work in Chromium-based browsers (Chrome, Edge, Brave,
  Opera, Vivaldi) and in Firefox, on Windows, macOS and Linux.

## Non-functional requirements

- **NFR-001** Privacy (constitution §II): the extension and the connector make no network
  requests. The extension sends nothing from the page except the job title, the company
  and the link. It keeps no copy of the page and no history.
- **NFR-002** Security (constitution §III): the connector accepts requests only from the
  Findy extension of the official stores. It validates every message as the main
  process validates IPC. It runs no code from the page.
- **NFR-003** The extension asks the browser for the smallest set of permissions: the
  active tab on a click, and the talk to the connector. It does not ask for access to
  all sites.
- **NFR-004** The popup shows the values within 1 second on a normal vacancy page.
- **NFR-005** Keyboard access, accessible names and WCAG 2.1 AA, as in spec 001.
- **NFR-006** All strings of the extension are in English and Ukrainian, with the same
  key parity as the app.
- **NFR-007** Automated tests MUST NOT reach real sites. They use local test pages.

## Edge cases

- The page lists more than one vacancy (a search result) → the rules of spec 009 give
  the first job posting or the page title; the user corrects the values.
- A single-page job site changes the vacancy without a page reload → the popup reads the
  page at the moment of the click.
- The link is longer than 2048 characters → the popup shows the validation error of
  spec 001 and does not add.
- The user clicks "Add to Findy" twice fast → Findy creates one application.
- Findy is open in another user account of the same computer → the connector uses the
  data of the browser's user account only.
- The database is locked or damaged → US-3.4, with the message of spec 003.
- The user installs the extension before Findy → US-3.1; after the install of Findy, the
  popup works without a reinstall of the extension.

## Out of scope

- Safari and other browsers that are not based on Chromium or Firefox.
- A choice of stage in the popup. The stage is always "Applied" (D-5).
- Other fields: salary, location, work format, contact, a note, the vacancy text.
- Site-specific readers (LinkedIn, Djinni, DOU and others). Generic rules only, as in
  spec 009.
- A button inside the vacancy page itself. The user clicks the extension button only.
- An "Open in Findy" action from the popup.
- A local network server or a link scheme (`findy://`) as the way to talk (D-2).

## Success criteria

- **SC-001** On a vacancy page with job posting data, the user adds an application with
  one click on the extension button and one click on "Add to Findy", without typing.
- **SC-002** On a LinkedIn vacancy page where the user is logged in, the popup shows the
  job title and the company.

## Decisions

- **D-1** The talk between the extension and Findy is a new exception to constitution
  §II. It needs an amendment, §II.9, in a separate PR with the `constitution` label:
  "The Findy browser extension may send the job title, the company and the link of the
  open page to Findy, only when the user clicks its button. Findy may tell the extension
  if an application with that link exists, and its stage. The talk stays on the
  computer, through the browser; there is no network listener." (owner, 2026-11-22)
- **D-2** The browser starts a Findy connector that talks to the extension over its
  standard input and output, as the MCP server of spec 004 does. Not a local network
  server and not a `findy://` link (owner, 2026-11-22).
- **D-3** The connector is always registered. There is no setting to turn it off. This
  is different from spec 004, where access is off by default. Only the official Findy
  extension can use the connector (NFR-002) (owner, 2026-11-22).
- **D-4** The popup shows the values, the user can correct them, and one click adds. No
  add without the popup, and no "Add application" dialog in Findy (owner, 2026-11-22).
- **D-5** Fields: job title, company and link only; stage always "Applied"
  (owner, 2026-11-22).
- **D-6** Duplicate check: the popup shows "Already in Findy" and the stage, with "Add
  anyway" (owner, 2026-11-22).
- **D-7** Browsers: Chromium-based and Firefox. Safari is later (owner, 2026-11-22).
- **D-8** The code of the extension is in this repository. The extension is released to
  the browser stores separately from the app releases (owner, 2026-11-22). Until it is in
  the stores, each app release has the extension as two zip files (Chromium, Firefox)
  with the version of the app, and the README tells how to load it (owner, 2026-11-22).
- **D-9** Defaults chosen without a question (change them before approval if needed):
  the popup language follows the browser language (Ukrainian or English); with more than
  one duplicate, the last updated one is shown; the connector works when the app is
  closed.
- **D-10** Duplicate check ignores `#…` and tracking parameters, but keeps other query
  parameters (FR-007) (owner, 2026-11-22).
- **D-11** FR-011 changed from "the installer, and the first start" to "every start of
  the app". The dmg, the zip for Scoop and the AppImage have no install step (plan D-2)
  (owner, 2026-11-22, after approval).

## Open questions

None.
