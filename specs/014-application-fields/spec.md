# Feature Spec: More application fields

- **ID:** 014-application-fields
- **Status:** Implemented (unreleased, #39)
- **Approved:** 2026-11-21 (owner)
- **Author(s):** owner
- **Created:** 2026-11-21
- **Builds on:** [001-mvp-board](../001-mvp-board/spec.md) (details panel, US-8 search),
  [004-mcp-server](../004-mcp-server/spec.md), [008-csv-import-export](../008-csv-import-export/spec.md),
  [011-job-sites](../011-job-sites/spec.md) (known and custom sites)
- **Related:** [015-next-step](../015-next-step/spec.md)

## Summary

Today an application has only a job title, a company, a link and notes. Users write the
salary, the work format, where they found the vacancy and who the recruiter is into
notes, so they cannot see these facts at a glance or search for them. This spec adds
optional fields to an application: a salary range, a work format and a location, a
source and one contact. The card shows the work format and the salary in one short
line. The source fills in by itself when the vacancy link is from a job site that
Findy knows.

## User stories

### US-1 — Record the salary (Priority: P1)

As a job seeker, I want to record the salary range of a vacancy, so that I can compare
offers without opening notes.

**Acceptance scenarios**

1. **Given** an application, **When** I open its details and enter "from 3000", "to
   4000", currency USD and period "per month", **Then** the details and the card show
   the range in the format of the active language, for example "$3,000–4,000/mo".
2. **Given** only "from 3000", **Then** the card shows "from $3,000/mo". **Given** only
   "to 4000", **Then** it shows "up to $4,000/mo".
3. **When** I enter "from" that is larger than "to", **Then** the form shows an error
   and does not save.
4. **When** I clear both amounts, **Then** the card shows no salary.

### US-2 — Record the work format and the location (Priority: P1)

As a job seeker, I want to mark a vacancy as remote, office or hybrid and to write its
location, so that I see this on the board.

**Acceptance scenarios**

1. **When** I choose "Remote" and enter the location "EU time zone", **Then** the card
   shows "Remote" and the details show both values.
2. **Given** a card with a work format and a salary, **Then** the card shows them in one
   line, for example "Hybrid · $3,000–4,000/mo".
3. **When** I choose "Not set", **Then** the card shows no work format.

### US-3 — Know where I found the vacancy (Priority: P2)

As a job seeker, I want to record the source of each application, so that I know which
sites and channels work for me.

**Acceptance scenarios**

1. **When** I open the source list, **Then** I see the job sites of the Sites tab (known
   sites, also hidden ones, and my own sites), and "Referral", "Company website",
   "Recruiter contacted me" and "Other".
2. **Given** a new application with the link `https://djinni.co/jobs/123/`, **When** I
   save it, **Then** its source is Djinni.
3. **Given** an application with a source that I chose, **When** I change the link to a
   link of another job site, **Then** the source does not change.
4. **Given** a link whose host is not a known or custom site, **Then** the source stays
   empty.
5. **Given** an application with the source "Acme careers" (my own site), **When** I
   delete that site on the Sites tab, **Then** the application still shows "Acme
   careers" as its source.

### US-4 — Keep the contact person (Priority: P2)

As a job seeker, I want to keep the name and the contact details of the recruiter, so
that I can write to them later.

**Acceptance scenarios**

1. **When** I enter the contact name "Olena" and the contact details
   "t.me/olena_hr", **Then** the details panel shows both.
2. **Given** contact details that are an `http`/`https` link, **Then** the details panel
   shows them as a link that opens in the system browser. Other text shows as plain text.

### US-5 — Find, export and share the new fields (Priority: P2)

As a user, I want search, CSV and my AI assistant to know the new fields.

**Acceptance scenarios**

1. **Given** an application with the location "Lviv", **When** I search "lviv",
   **Then** the board shows that card.
2. **When** I export to CSV and import the file into an empty board, **Then** every new
   field comes back unchanged.
3. **Given** a CSV file from Findy 0.5 (without the new columns), **When** I import it,
   **Then** the import works as before and the new fields are empty.
4. **Given** AI assistant access is on, **When** the assistant asks for an application,
   **Then** the result has the new fields; **When** it updates the salary, **Then** the
   board shows the new salary within 2 s.

## Functional requirements

### Data

- **FR-001** An application MUST have these optional fields. "Empty" is the default for
  every field, also for applications that exist before the update:
  - Salary from and Salary to: whole numbers from 0 to 1 000 000 000.
  - Currency: one of USD, EUR, UAH, GBP, PLN.
  - Salary period: "per month" or "per year".
  - Work format: Remote, Office or Hybrid.
  - Location: text, trimmed, 1–100 characters.
  - Source: a known job site, a custom job site, Referral, Company website, Recruiter
    contacted me, or Other.
  - Contact name: text, trimmed, 1–100 characters.
  - Contact details: text, trimmed, 1–200 characters.
- **FR-002** When Salary from and Salary to are both set, Salary from MUST be less than
  or equal to Salary to.
- **FR-003** When at least one amount is set, Currency and Salary period MUST be set.
  When both amounts are empty, Currency and Salary period MUST be empty too.
- **FR-004** A change to any of these fields MUST update the application's `updatedAt`.
  It MUST NOT add a stage history entry, change the card position or reset the "no
  movement" count (spec 010 FR-002).
- **FR-005** When the source is a custom site, the application MUST keep that site's
  name. If the user deletes or renames the site, the application MUST keep the name
  that it had when the user chose it (D-6).

### Editing

- **FR-010** The details panel MUST show and edit all the fields of FR-001 in a
  "Details" group. Each field MUST have a visible label and keyboard access.
- **FR-011** The dialog "New application" MUST NOT get new fields (D-7). The user adds
  them in the details panel.
- **FR-012** In the salary inputs, the currency MUST default to the currency of the
  last application that the user gave a salary, else USD. The period MUST default to
  "per month".
- **FR-013** Invalid values MUST show an error next to the field and MUST NOT be saved.

### Source from the link

- **FR-020** When an application is created with a link, or gets a link while its
  source is empty, the source MUST be set to the job site whose address has the same
  host as the link. A subdomain of the site's host also matches, and a leading `www.`
  is ignored. Known sites MUST be checked before custom sites.
- **FR-021** The automatic source MUST NOT replace a source that is already set.
- **FR-022** FR-020 MUST apply to applications that the user adds in the app, by CSV
  import (only when the file gives no source) and through MCP (only when the call gives
  no source).

### Card

- **FR-030** A card MUST show the work format and the salary in one line under the
  company, separated by " · ". If a field is empty, the line MUST leave it out. If both
  are empty, the card MUST NOT show the line.
- **FR-031** The salary MUST be formatted with the active language: the currency symbol
  or code, digit grouping, and a short period ("/mo", "/yr" and their Ukrainian forms).
  A range MUST use an en dash.
- **FR-032** The card MUST NOT show the location, the source or the contact.

### Search, CSV and MCP

- **FR-040** Board search (spec 001 US-8) MUST also match the location, the source
  name, the contact name and the contact details. It MUST NOT match amounts.
- **FR-041** CSV export MUST add these columns after the spec 008 FR-003 columns, in
  this order: Salary from, Salary to, Currency, Salary period, Work format, Location,
  Source, Contact name, Contact details. Headers and values of Salary period, Work
  format and Source MUST be in the active language. Currency MUST be the code.
- **FR-042** CSV import MUST accept these columns as optional (spec 008 FR-012). It MUST
  accept values in English, in Ukrainian, or as ids. Currency MUST be accepted as a code
  in any letter case. A source that is not a known site, not a custom site and not a
  fixed source MUST be imported as that custom-site name (FR-005). A row that breaks
  FR-001…FR-003 MUST be skipped with a reason (spec 008 FR-014).
- **FR-043** A Findy export MUST import back without loss of the new fields (extends
  spec 008 FR-019).
- **FR-044** The MCP tools `get_application` and `list_applications` MUST return the new
  fields. `add_application` and `update_application` MUST accept them with the same
  rules (spec 004 FR-003). An update MUST be able to clear a field.

## Non-functional requirements

- **NFR-001** All new text in English and Ukrainian. Numbers and currencies use the
  active language (constitution §V).
- **NFR-002** Keyboard access and accessible names for every new control; WCAG 2.1 AA
  contrast for the card line (constitution §VIII).
- **NFR-003** With 1 000 applications, opening the board and searching stay as fast as
  before (no change a user can see).
- **NFR-004** The database update keeps all existing data and runs once at start.

## Edge cases

- A very long location or contact: the details panel wraps the text; the card does not
  show it.
- Salary 0: a valid amount ("from $0" is shown). Empty and 0 are different.
- The link changes from Djinni to LinkedIn after Findy set the source by itself: the
  source stays Djinni (FR-021). The user can change it by hand.
- A known site is hidden on the Sites tab: it is still in the source list and still
  matches links (US-3.1).
- A board reset (spec 001 FR-090) deletes the applications together with their fields.

## Out of scope

- Analytics by source, salary or work format.
- Currency conversion, a "net/gross" flag, more currencies than FR-001.
- More than one contact, a contact list across applications.
- Filters or sorting by the new fields.
- New fields in the dialog "New application".
- Reading the salary or the location from the vacancy page (spec 009).

## Success criteria

- **SC-001** A user can see the work format and the salary of every application on the
  board without opening a card.
- **SC-002** For a vacancy link from any known job site, the source fills in with no
  action from the user.
- **SC-003** A CSV round trip keeps 100 % of the new field values.

## Decisions

- **D-1** Two specs: this spec for the fields, [015](../015-next-step/spec.md) for the
  next step and reminders (owner, 2026-11-21).
- **D-2** Salary is a range with a currency and a period, not free text, so a later spec
  can add analytics (owner).
- **D-3** Source is a list (job sites + fixed sources) and fills in from the link host
  (owner).
- **D-4** One contact per application: a name and one free-text details field. Other
  people go into notes (owner).
- **D-5** Location is a work format plus free text (owner). The new fields also go to
  the card (compact), CSV, MCP and search (owner).
- **D-6** A source that points to a custom site keeps its name, so a deleted site does
  not leave the application without a source.
- **D-7** The dialog "New application" stays short (title, company, link), as spec 001
  intends "quick add". The source still fills in from the link (FR-020).

## Open questions

None.
