# Tasks: Project website

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

Legend: `[P]` — can run in parallel with other `[P]` tasks in the same phase.
Each task references the requirement(s) it satisfies.

## Phase 1 — Setup

- [x] T001 `website/` package: `package.json` with `astro` and test tools,
  `astro.config.mts`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.mts` (80 %
  gate on `src/lib`); scripts `dev`, `build`, `lint`, `test`, `test:coverage`; root
  ESLint, Prettier and Vitest ignore `website/`; ignore `website/dist`, `website/.astro`
  (NFR-006)
- [x] T002 `SITE_URL`, `SOURCE_URL` and `releaseFileUrl()` in `src/shared/project.ts`
  with root unit tests; Astro `site`/`base` from `SITE_URL` (FR-030)

## Phase 2 — Foundations

- [x] T010 [P] `lib/paths.ts`: page path for a language and slug, the other-language
  path; unit tests (FR-020, FR-021)
- [x] T011 [P] `website/src/i18n/` en and uk strings, `uk` typed as `en`; key parity
  test (US-3, NFR-007)
- [x] T012 `BaseLayout`: `lang`, title, description, canonical, `hreflang`, Open Graph,
  CSP meta, skip link; theme tokens and reset in `global.css` (FR-040, FR-041, NFR-002,
  NFR-003)
- [x] T013 Header with navigation and language switch; footer with support, source,
  issues, licence (FR-020, FR-022, FR-023, US-5)

## Phase 3 — US-1 Understand Findy and download it (P1)

- [x] T020 [P] `lib/release.ts`: release JSON → download list, version label; unit tests
  with a full and a partial release (FR-010, FR-012, FR-014)
- [x] T021 [P] `lib/os.ts`: `detectOs()` for Windows, macOS, Linux, Android, iOS,
  iPadOS, unknown; unit tests (FR-011, FR-013)
- [x] T022 `data/release.ts`: build-time fetch of the latest release, fail on error
  (FR-010, FR-032)
- [x] T023 `Download` component: every build in the HTML, inline script sets `data-os`,
  CSS shows the main button; Homebrew and Scoop commands; extension files; release page
  link (FR-011 – FR-015)
- [x] T024 Home page en and uk: what Findy does, features, screenshots in the page
  language (lazy below the first view), "free, open source, local data, no account",
  unsigned-builds note with link to the install guide (FR-001 – FR-005, NFR-005)

## Phase 4 — US-2 Read the guides on the website (P1)

- [x] T030 [P] `lib/guides.ts` and `lib/guideLinks.ts`: file id → slug and language;
  link rewrite (guide → site page, anchor kept, repository file → `SOURCE_URL`,
  absolute kept); unit tests (FR-007, FR-008)
- [x] T031 Guides content collection over `docs/guide`, remark plugin, guide pages en
  and uk; build fails on a guide with no translation (FR-006, FR-007, edge case)

## Phase 5 — US-4 Find the website (P2)

- [x] T040 `sitemap.xml` and `robots.txt` endpoints (FR-042)

## Phase 6 — Tests of the built site

- [x] T050 `website/tests/built/`: every page has `lang`, title, description, canonical,
  both `hreflang`; internal links start with the base and resolve to a file; no external
  `src`, stylesheet or script (NFR-001); every download link goes to a release file
  (FR-012); the Ukrainian pages use the uk screenshots (US-1 to US-4)
- [x] T051 `website/tests/browser/`: axe on every page in light and dark; keyboard
  reaches the download button and the language switch; `data-os` picks the right group
  for Windows, macOS, Linux and a phone user agent; no horizontal scroll at 360 px
  (FR-011, FR-013, NFR-002, NFR-004)

## Phase 7 — Publication

- [ ] T060 `ci.yml`: job `Changes` (outputs `desktop`, `website`); desktop jobs run only
  if `desktop`; job `Website` runs the website gate (`lint`, `test:coverage`, `build`,
  `test:built`, `test:browser`) only if `website`; job `CI result` fails if a needed job
  failed or was cancelled (FR-033, plan D-5)
- [ ] T061 `.github/workflows/site.yml`: build and deploy to Pages on push to `main`
  (`website/`, guides, screenshots, logo, `project.ts`), on `release: published`, and
  by hand (FR-031, FR-032)
- [ ] T062 Docs: `docs/architecture.md` (project tree, D-8 website), `docs/release.md`
  (CI by changed part, the one required check `CI result`, site workflow, one-time Pages
  and homepage setup), `CLAUDE.md` commands, README links to the website (FR-034)
- [ ] T063 Before merge (owner approves): branch protection requires `CI result`
  instead of the four checks (plan D-5)

## Phase 8 — After merge (owner approves each step)

- [ ] T070 Turn on Pages with the source "GitHub Actions"; run the site workflow; set
  the repository homepage to the website (FR-030, FR-034, SC-001, SC-003)
