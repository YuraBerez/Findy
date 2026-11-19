# Feature Spec: Add an application from a link

- **ID:** 009-add-from-link
- **Status:** Implemented (0.4.0)
- **Approved:** 2026-11-19 (owner)
- **Created:** 2026-11-19
- **Builds on:** [001-mvp-board](../001-mvp-board/spec.md) (US-1, FR-010), [003-error-handling](../003-error-handling/spec.md)
- **Needs:** a constitution amendment to §II (see D-1)

## Summary

To add an application now, the user copies the job title and the company from the
vacancy page one by one. The user wants to paste only the vacancy link. In the "Add
application" dialog, when the user pastes a link, Findy reads the vacancy page and
fills the job title and the company. The user checks the values and saves. Findy reads
only the page that the user pasted, and only at that moment. It sends no user data.
When the page gives no data, or the computer is offline, the dialog works as before.

## User stories

### US-1 — Paste a link, get the title and the company (P1)

As a job seeker, I want to paste a vacancy link and get the job title and the company
filled in, so that I add an application in a few seconds.

**Acceptance scenarios**

1. **Given** the "Add application" dialog with empty fields, **When** I paste a link to
   a vacancy page that has vacancy data, **Then** the job title and the company fill in
   within a few seconds, and the link stays in the link field.
2. **When** the fields are filled, **Then** nothing is saved yet: I can change the
   values and save, or cancel.
3. **Given** I already typed a job title, **When** I paste a link, **Then** my title
   stays as it is; only the empty company field fills in.
4. **While** the page loads, **Then** the dialog shows that it reads the page, and I
   can still type, save or cancel.
5. **Given** I type a link instead of pasting it, **When** I use the "Fill from link"
   button next to the link field, **Then** the fields fill in the same way.

### US-2 — No data, no network (P1)

As a user, I want the dialog to keep working when Findy cannot read the page.

**Acceptance scenarios**

1. **Given** no network connection, a site that does not answer, or a page without
   vacancy data (for example, a page that needs a login), **When** I paste the link,
   **Then** a short message under the link field says that Findy could not get the
   data, and I fill in the fields myself.
2. **Given** a link that is not a valid `http`/`https` link, **When** I paste it,
   **Then** Findy does not read anything and shows the usual link validation error.
3. **When** I close the dialog while the page loads, **Then** nothing changes and no
   message shows later.

### US-3 — Keyboard and both languages (P1)

1. **Given** a keyboard only, **Then** I can paste the link, use "Fill from link" and
   reach the filled fields.
2. **Given** the app in Ukrainian, **Then** the button, the status and the messages are
   in Ukrainian. The filled values are as on the page (never translated).

## Functional requirements

- **FR-001** When a valid `http`/`https` link is pasted into the link field of the
  "Add application" dialog, Findy MUST read that page and fill the job title and the
  company from it (FR-004).
- **FR-002** The dialog MUST have a "Fill from link" button next to the link field. It
  is available when the link field holds a valid `http`/`https` link and no read is
  in progress.
- **FR-003** Findy MUST fill only fields that are empty at the moment the data arrives.
  It MUST NOT change text that the user typed.
- **FR-004** Findy MUST take each value from the first source that has it, in this
  order (D-4):
  1. structured job posting data that the page publishes for search engines (job
     title, hiring organisation), in either of its two common forms;
  2. the title of the page for link previews, else the page title, split into the job
     title and the company when it has the form "Job title — Company" (also with `-`,
     `|`, `·` or "at"), without the part that is the site's own name;
  3. the main heading of the page as the job title, and the first page element marked
     as a company or an employer as the company;
  4. the site name of the link preview as the company.

  Script, style and hidden template content of the page MUST NOT be read. Values MUST
  be trimmed, have HTML entities decoded and whitespace collapsed, and be cut to the
  field limits of spec 001 (200 characters).
- **FR-005** While the page loads, the dialog MUST show a status next to the link field
  that screen readers announce. The other fields and the buttons stay usable.
- **FR-006** When Findy gets no title and no company (no network, timeout, an error
  answer, a page that is not HTML, too large, or no vacancy data), the dialog MUST show
  one short message under the link field. It is not an error notification (spec 003)
  and it does not block saving.
- **FR-007** If the user changes the link while a read runs, or closes the dialog, the
  result of the old read MUST be ignored.
- **FR-008** Findy MUST NOT save anything because of a read. The user saves with the
  usual "Save" button (spec 001 US-1).
- **FR-009** This feature is only in the "Add application" dialog. The details panel
  does not read links.
- **FR-010** Until a read starts, the line under the link field MUST say that a pasted
  vacancy link fills in the job title and the company (added 2026-11-19 at the owner's
  request). The status of FR-005 and the message of FR-006 replace it; a changed link
  shows it again.

## Non-functional requirements

- **NFR-001** Privacy and security (constitution §II, §III): a read is one request to the
  pasted link only, started by the user's paste or button. The request has no cookies,
  no stored login, and no data about the user or the board. Findy does not run scripts
  of the page, does not load its images or other files, and does not show the page.
  Redirects are followed only to `http`/`https` links, at most 5.
- **NFR-002** A read MUST stop after 10 seconds or after 2 MB of page data, and then
  act as FR-006.
- **NFR-003** Both languages, keyboard access and WCAG 2.1 AA, as in spec 001.
- **NFR-004** Automated tests MUST NOT reach real sites: they use local test pages.

## Edge cases

- The page lists two vacancies in its data → the first job posting is used.
- The link preview title is "Senior QA — Acme | Jobs" with the site name "Jobs" and
  there is no job posting data → "Senior QA" and "Acme" (FR-004 step 2).
- A title that cannot be split ("Senior QA at a fintech startup!") → the job title gets
  the whole text without the site name; the company comes from a later step.
- A page that needs a login, with the heading "Sign in" and no other data → the job
  title gets "Sign in"; the values are suggestions, and the user corrects them.
- A job board as the site name (for example "Djinni") is used as the company only when
  nothing else gives one (FR-004 step 4); the user corrects it.
- The page is in Ukrainian, or the bytes are not UTF-8 but the page names its encoding
  → the text is decoded with that encoding.
- The user pastes the same link twice → a new read each time; filled fields stay
  filled (FR-003).
- A link to a file (PDF, image) → not HTML, FR-006.
- An application with the same link exists → no special handling (duplicates are
  allowed in the app, spec 001).

## Out of scope

- Site-specific readers (LinkedIn, Djinni, DOU and others) and logins to sites.
- A language model, local or in the cloud (D-6).
- Other fields: vacancy description, salary, location, a first note.
- Reading links in the details panel, from MCP, or in CSV import.
- A setting to turn the feature off (a read happens only on the user's action).
- Saving the page or a copy of it.

## Success criteria

- **SC-001** On a page with job posting data, the user adds an application with a paste
  and one "Save", without typing.
- **SC-002** Offline, the dialog adds an application as before, with one short message.

## Decisions

- **D-1** Reading the pasted page is a third exception to constitution §II.1/§II.3 ("no
  network requests"). It needs an amendment, §II.7, in a separate PR with the
  `constitution` label: "When the user pastes a vacancy link in the app, the app may
  read that one page to fill in the application. It sends no user data and runs no
  code from the page." (owner, 2026-11-19)
- **D-2** Fields: job title and company only; the link stays in the link field
  (owner, 2026-11-19).
- **D-3** In the existing "Add application" dialog: the values fill in, the user checks
  them and saves. No separate quick-add action (owner, 2026-11-19).
- **D-4** Generic rules only, no site-specific readers: structured data, then the
  title split, then the visible page (main heading, an element marked as a company)
  (owner, 2026-11-19; extended the same day, before the code was done).
- **D-6** A local model as a fallback, for pages where the rules give nothing, is a
  possible later spec. It is decided after a test on 20–30 real vacancy pages of
  popular job boards and company sites (owner, 2026-11-19).
- **D-5** Defaults chosen without a question (change them before approval if needed):
  read on paste plus a "Fill from link" button; only empty fields fill in; 10 s and
  2 MB limits; at most 5 redirects; no setting to turn it off; a short inline message
  instead of an error notification.

## Open questions

None.
