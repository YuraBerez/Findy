# Feature Spec: Project website

- **ID:** 020-website
- **Status:** Approved
- **Approved:** 2026-11-23 (owner)
- **Author(s):** owner
- **Created:** 2026-11-23
- **Builds on:** [012-package-managers](../012-package-managers/spec.md) (Homebrew,
  Scoop, checksums), [016-mcp-skill](../016-mcp-skill/spec.md) and
  [017-skill-install-command](../017-skill-install-command/spec.md) (AI assistant),
  [019-browser-extension](../019-browser-extension/spec.md) (browser extension)

## Summary

Today Findy has no website. A person who hears about Findy finds only the GitHub
repository, and search engines show only that page. SignPath refused the code-signing
application because the project has low visibility. This spec adds a free public website
for Findy. It explains what Findy does, shows screenshots, and gives a download button for
the operating system of the visitor. It also shows the user guides (install, browser
extension, AI assistant) in English and Ukrainian. The guides come from the same text as
the guides in the repository, so the text has one source. The app does not change.

## Glossary

| Term | Meaning |
|------|---------|
| **Website** | The public pages of Findy on the free address of the project host. |
| **Home page** | The first page of the website, in one language. |
| **Guide** | A user guide in the repository: install, browser extension, AI assistant. |
| **Latest release** | The latest published, stable release (no drafts, no pre-releases), as in spec 006. |

## User stories

### US-1 — Understand Findy and download it (Priority: P1)

As a job seeker who hears about Findy, I want to see what it does and download it for my
computer in one click, so that I can try it without reading the GitHub repository.

**Acceptance scenarios**

1. **Given** a visitor on Windows, **When** the visitor opens the home page, **Then** the
   main button downloads the Windows installer of the latest release and shows its version.
2. **Given** a visitor on Linux, **When** the visitor opens the home page, **Then** the
   main button offers the Linux build of the latest release.
3. **Given** a visitor on macOS, **When** the visitor opens the home page, **Then** the
   page offers the Apple Silicon and the Intel builds, and tells how to find which Mac it is.
4. **Given** any visitor, **When** the visitor looks under the main button, **Then** the
   page shows links to the builds for the other systems, to Homebrew and Scoop, and to the
   release page.
5. **Given** the page cannot find the system of the visitor (for example, a phone),
   **When** the home page opens, **Then** it shows the builds for all systems, with no
   preferred one.
6. **Given** the home page, **When** the visitor reads it, **Then** it shows what Findy
   does, screenshots of the board, the application details, analytics and job sites, and
   says that the data stays on the computer.

### US-2 — Read the guides on the website (Priority: P1)

As a new user, I want to read the install, browser extension and AI assistant guides on
the website, so that I do not look for them in the repository.

**Acceptance scenarios**

1. **Given** the website, **When** the visitor opens a guide, **Then** it shows the same
   text as that guide in the repository, in the same language.
2. **Given** the owner changes a guide in the repository, **When** the change is in the
   main branch, **Then** the website shows the new text after the next publication.
3. **Given** a guide links to another guide, **When** the visitor clicks the link,
   **Then** the website opens that guide on the website, not on GitHub.

### US-3 — Use the website in Ukrainian (Priority: P1)

As a Ukrainian-speaking visitor, I want the website in Ukrainian, so that I understand it
without English.

**Acceptance scenarios**

1. **Given** any page, **When** the visitor uses the language switch, **Then** the same
   page opens in the other language.
2. **Given** the website, **When** a visitor opens the address without a language,
   **Then** the English home page opens. The website does not redirect by itself.
3. **Given** a Ukrainian page, **When** the visitor reads it, **Then** every text on it
   is in Ukrainian, and the screenshots show the Ukrainian app.

### US-4 — Find the website from GitHub and search engines (Priority: P2)

As the owner, I want the repository and search engines to point to the website, so that
more people find Findy.

**Acceptance scenarios**

1. **Given** the repository page on GitHub, **When** a person looks at the "About" part,
   **Then** it links to the website.
2. **Given** a page of the website, **When** a search engine or a social network reads
   it, **Then** it finds a title, a description, a preview image and the language of the
   page, and a link to the same page in the other language.

### US-5 — Support the project (Priority: P3)

As a user who likes Findy, I want a link to support the project, so that I can help it.

**Acceptance scenarios**

1. **Given** any page, **When** the visitor looks at the footer, **Then** it shows links
   to the support page, the source code, the issues and the licence.

## Functional requirements

### Content

- **FR-001** The website MUST have a home page in English and in Ukrainian.
- **FR-002** The home page MUST tell what Findy does and show the main features: the
  board of stages, notes and the next step, analytics, job sites, CSV import and export,
  the browser extension and the AI assistant.
- **FR-003** The home page MUST show screenshots of the app in the language of the page,
  in a slider in the first view. The slider changes the screenshot by itself and has
  buttons for the previous and the next screenshot, one button for each screenshot, and
  a pause button. It does not change by itself when the system asks for reduced motion.
  Without scripts, the visitor scrolls the screenshots. All screenshots have the same
  height.
- **FR-004** The home page MUST say that Findy is free and open source, that it keeps all
  data on the computer, and that it has no account.
- **FR-005** The website MUST say that the builds are not signed yet, and link to the
  first-start steps in the install guide.
- **FR-006** The website MUST show each guide (install, browser extension, AI assistant)
  as a page in English and in Ukrainian.
- **FR-007** The text of a guide page MUST come from the guide in the repository. The
  owner MUST NOT keep a second copy of a guide.
- **FR-008** A link in a guide to another guide MUST open the website page of that guide.
  Other links in a guide MUST keep their target.

### Download

- **FR-010** The home page MUST show the version of the latest release.
- **FR-011** The main download button MUST offer the build for the system of the
  visitor: the Windows installer, the macOS builds for Apple Silicon and Intel, or the
  Linux builds (AppImage and the Debian package).
- **FR-012** The download links MUST go to files of the latest release on the project
  host. The website MUST NOT keep copies of the builds.
- **FR-013** If the system of the visitor is unknown, the page MUST show all builds with
  no preferred one.
- **FR-014** The page MUST also show: the Windows portable build, the Homebrew and Scoop
  commands, the browser extension files, and a link to the release page with the checksums.
- **FR-015** Without scripts in the browser, the page MUST still show every download link.

### Language and navigation

- **FR-020** Every page MUST have a language menu that opens the same page in each
  language. The menu works with the keyboard and without scripts.
- **FR-021** The address without a language MUST open the English home page. The website
  MUST NOT choose the language from the browser settings.
- **FR-022** Every page MUST have a navigation to the home page and to each guide. The
  header has the main links and a download button; the footer lists every guide.
- **FR-023** Every page MUST have a footer with links to the support page, the source
  code, the issues and the licence.

### Publication

- **FR-030** The website MUST be on the free address of the project host. It MUST cost
  nothing.
- **FR-031** A change to the website or to a guide in the main branch MUST publish the
  website again without a manual step.
- **FR-032** A new latest release MUST publish the website again, so the version and the
  download links change without a manual step.
- **FR-033** A pull request MUST build the website, so a broken build stops the merge.
- **FR-034** The "About" part of the repository MUST link to the website.

### Search engines and previews

- **FR-040** Every page MUST have its own title, description and language, and a link
  to the same page in the other language.
- **FR-041** Every page MUST have a preview image and a short text for social networks.
- **FR-042** The website MUST give search engines a list of its pages.
- **FR-043** The titles and descriptions MUST name what Findy is in the words people
  search for ("job application tracker", «трекер пошуку роботи»). Every page has its own
  description. The home page gives search engines structured data about the app: a free
  desktop app, its systems, version and download page.
- **FR-044** An address that does not exist MUST show a page in both languages with a
  link to each home page. Search engines do not index it.

## Non-functional requirements

- **NFR-001** Privacy: the website MUST NOT use analytics, cookies, trackers or other
  sites at run time (no external fonts, scripts or images). Only the download links go to
  the project host. The browser storage keeps only the theme that the visitor picked
  (NFR-003); it never leaves the browser.
- **NFR-002** Accessibility: every link and button MUST work with the keyboard and have
  an accessible name. Text contrast MUST meet WCAG 2.1 AA. Colour is never the only signal.
- **NFR-003** The website MUST follow the light or dark theme of the system, with the
  brand colours of `docs/brand.md`. A button in the header switches between light and
  dark. The browser keeps that choice for the next visit.
- **NFR-004** The website MUST work on a phone (360 px wide) with no horizontal scroll.
  On a narrow screen the header shows the logo, the download button and a menu button;
  the links, the languages and the theme are in the menu. Without scripts the menu stays
  open.
- **NFR-005** The home page MUST load fast: the first view loads less than 1 MB without
  the screenshots below it, and the screenshots load only when the visitor scrolls to them.
- **NFR-006** The website MUST be static: no server code and no database.
- **NFR-007** All English text on the website follows `/writing-style`. Ukrainian text
  follows the tone of the app.

## Edge cases

- The latest release has no file for a system (for example, a release without the Intel
  build): the page does not show a broken link for that system.
- The project host cannot give the latest release when the website builds: the build
  fails and the old website stays.
- A guide links to a file in the repository that is not a guide (for example, a spec):
  the link goes to that file on GitHub.
- A guide exists in English only: the build fails, so a missing translation is found
  before publication.
- Very long Ukrainian text in buttons and navigation on a phone: the text wraps, it does
  not overflow.

## Out of scope

- Changes in the app, for example links from the app to the website.
- A custom domain name. A later spec can add it.
- A blog, news, a changelog page or a page for each release.
- Analytics of visits.
- Downloads hosted on the website.
- Languages other than English and Ukrainian.

## Success criteria

- **SC-001** The website opens on the free address, in English and Ukrainian.
- **SC-002** A visitor on Windows, macOS or Linux downloads the right build in two clicks
  or fewer from the home page.
- **SC-003** The repository "About" part links to the website.
- **SC-004** A change to a guide in the main branch shows on the website with no manual
  step.

## Decisions

- **D-1** Host: the free pages of the project host (GitHub Pages), at the free address of
  the repository. No custom domain for now. (owner, 2026-11-23)
- **D-2** The website is made by a static site generator. The owner chose it; the plan
  names it. (owner, 2026-11-23)
- **D-3** The download button finds the system of the visitor and offers its build; links
  to all other builds are under it. (owner, 2026-11-23)
- **D-4** The guides are pages on the website, made from the guides in the repository,
  with no second copy. (owner, 2026-11-23)
- **D-5** The website publishes on each change in the main branch, and after each new
  release. (owner, 2026-11-23)
- **D-6** No analytics on the website. (owner, 2026-11-23)
- **D-7** The constitution needs no change: §II is about the app and the user data. The
  website keeps the same spirit (NFR-001).
- **D-8** After the first review of the pages: the screenshots move into a slider in the
  first view; the language switch becomes a menu; a theme button switches light and dark;
  the features show the stages and short items with icons; each build is a row with its
  size. (owner, 2026-11-23)

## Open questions

None.
