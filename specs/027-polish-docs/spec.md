# Feature Spec: Polish documentation and website

- **ID:** 027-polish-docs
- **Status:** Implemented (0.9.0)
- **Approved:** 2026-11-28 (owner)
- **Author(s):** owner
- **Created:** 2026-11-28
- **Builds on:** [026-polish](../026-polish/spec.md) (D-1),
  [020-website](../020-website/spec.md) (FR-001, FR-003, FR-006, FR-020, FR-040, FR-044),
  [024-extension-settings](../024-extension-settings/spec.md) (FR-004)
- **Changes:** spec 026 left the website, the guides and the README out of scope (D-1).
  This spec adds them in Polish.

## Summary

Findy has a Polish interface (spec 026), but a Polish visitor finds the README, the guides
and the website only in English and Ukrainian. This spec adds a Polish README, Polish
guides (install, browser extension, AI assistant), a Polish version of the website with
Polish screenshots, and points the "How to install" button of the app to the Polish guide
when the app is in Polish.

## User stories

### US-1 — Read about Findy in Polish (Priority: P1)

As a Polish visitor, I want the website and the README in Polish so that I understand what
Findy is and how to install it.

**Acceptance scenarios**

1. **Given** the website, **When** I select "Polski" in the language menu, **Then** the
   same page opens in Polish, with Polish texts and screenshots of the app in Polish.
2. **Given** the Polish home page, **Then** the download buttons and the release version
   are the same as on the other languages.
3. **Given** the README on GitHub, **When** I click "Po polsku", **Then** the Polish README
   opens. The Polish README links to the English and the Ukrainian ones.

### US-2 — Read the guides in Polish (Priority: P1)

As a Polish user, I want the guides in Polish so that I can install Findy, the extension
and the assistant connection.

**Acceptance scenarios**

1. **Given** the Polish website, **When** I open a guide, **Then** it shows the Polish
   guide from the repository.
2. **Given** a Polish guide links to another guide, **Then** the link opens the Polish page
   of that guide.
3. **Given** the app is in Polish, **When** I click "Jak zainstalować" on the browser
   extension page of the settings, **Then** the Polish guide opens.

## Functional requirements

- **FR-001** The repository MUST have `README.pl.md` with the content of the English
  README in Polish. Each README MUST link to the other two languages.
- **FR-002** Each guide (install, browser extension, AI assistant) MUST have a Polish file
  next to the English and the Ukrainian ones.
- **FR-003** The website MUST have every page in Polish under `/pl/`: the home page, each
  guide and the "not found" page (020 FR-044). The language menu MUST list English,
  Українська and Polski, and open the same page in the chosen language (020 FR-020).
- **FR-004** The Polish home page MUST show screenshots of the app in Polish (020 FR-003).
- **FR-005** Polish pages MUST have their own title, description, `lang="pl"` and language
  links for search engines, as the other languages (020 FR-040…FR-043); the page list for
  search engines includes them.
- **FR-006** The "How to install" button of the browser extension page (024 FR-004) MUST
  open the Polish guide when the app is in Polish.
- **FR-007** A missing Polish guide or website text MUST fail the website build or its
  tests, as for Ukrainian (020 edge case).

## Non-functional requirements

- **NFR-001** The Polish pages pass the same accessibility and layout checks as the other
  languages (020 tests in the browser).
- **NFR-002** The texts are checked by a person who reads Polish before the release (026
  D-3); the PR lists the terms.
- **NFR-003** The address without a language still opens the English home page; the
  website does not redirect by itself (020 FR-021).

## Edge cases

- A guide changes in English later: the Polish file stays; the tests check that each
  guide exists in every language, not that the texts match.
- A visitor with a Polish browser opens the root address: English, with "Polski" in the
  language menu (no automatic redirect, 020 FR-021).

## Out of scope

- A Polish skill for assistants (the skill stays English, 026 FR-009).
- Polish texts in the store listings of the browser extension (already in 026 FR-008).
- Translations of `CONTRIBUTING.md`, `PRIVACY.md`, `SECURITY.md` and the specs.

## Success criteria

- **SC-001** A Polish visitor can go from the website home page to the installed app and
  the extension with Polish pages only.

## Decisions

- **D-1** README, guides and website in Polish (owner, 2026-11-28).
- **D-2** Release 0.9.0 waits for this spec, so the app link to the Polish guide ships with
  the Polish interface (owner, 2026-11-28).

## Open questions

- None.
