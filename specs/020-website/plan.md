# Implementation Plan: Project website

- **Spec:** [spec.md](spec.md) · **Architecture:** [docs/architecture.md](../../docs/architecture.md)
- **Status:** Approved

## Summary

A static Astro site in `website/`, a separate npm package with its own lockfile, tests
and quality gate. CI builds it and publishes it to GitHub Pages at
`https://yuraberez.github.io/Findy/`. English pages are at the root, Ukrainian pages
under `uk/`. The guide pages are rendered from `docs/guide/*.md` at build time. The
build reads the latest release from the GitHub API once and writes the download links
into the HTML. A small inline script picks the build for the system of the visitor. The
pure logic (system detection, release files, guide links) lives in `website/src/lib/`
and has unit tests. Tests of the built HTML and an axe audit in Chromium check the pages.

## Technical context

| Item | Choice |
|------|--------|
| Language | TypeScript (strict), Astro components |
| Frameworks | Astro 7 (static output, no UI framework, no client islands) |
| Storage | None. Release data comes from the GitHub API at build time |
| Testing | Vitest (pure logic with coverage ≥ 80 %; built HTML); Playwright + axe in Chromium |
| Target platforms | Any modern browser; 360 px and wider |

## Constitution check

| Principle | Complies? | Notes |
|-----------|-----------|-------|
| I. Spec first | Yes | Spec 020 approved 2026-11-23 |
| II. Local-first | Yes | The app does not change. The website has no analytics, cookies or third-party resources (NFR-001); a test checks every `src`/`href` of the built pages |
| III. Secure Electron | n/a | No Electron code changes. The site sends a CSP `<meta>` that allows only its own origin |
| IV. Cross-platform | Yes | Downloads for all three systems; nothing is skipped when one is unknown (FR-013) |
| V. i18n | Yes | en and uk pages; site strings in `website/src/i18n/`, with key parity checked by the type of the `uk` object and by a test. They stay out of `locales/*.json`, because the app bundles those files |
| VI. Tested | Yes | The website package has its own gate: `lint` (ESLint + `astro check`) and `test:coverage` (≥ 80 % on `src/lib`), plus built-HTML tests and axe for the acceptance scenarios |
| VII. Simplicity | Yes | Dependencies only in `website/package.json`: `astro` (MIT) and test tools. The app's dependencies do not change. No Astro integrations: the sitemap is a short endpoint |
| VIII. Accessible | Yes | Plain links and buttons, skip link, visible focus, AA contrast; axe runs on every page in both themes |

## Architecture

```
GitHub API (latest release) ──build──▶ website/src/lib/release.ts ─▶ download list
docs/guide/*.md ──content collection──▶ guide pages (links rewritten by lib/guideLinks.ts)
docs/screenshots/*.png, assets/logo.svg ──astro:assets──▶ optimised images
src/shared/project.ts ──import──▶ every GitHub and website URL
                                  │
                         website: astro build
                                  ▼
               website/dist ──upload-pages-artifact──▶ GitHub Pages
```

- **Separate package.** `website/` has its own `package.json`, `package-lock.json`,
  ESLint, TypeScript, Vitest and Playwright configs. The root ESLint, Prettier and Vitest
  ignore it. The only shared source is `src/shared/project.ts` (imported by a relative
  path, so the project URLs stay in one place) and the files the pages show
  (`docs/guide`, `docs/screenshots`, `assets/logo.svg`).
- **Build-time data.** `website/src/data/release.ts` fetches `LATEST_RELEASE_API_URL`
  once per build (with `GITHUB_TOKEN` when set). A failed request or an empty file list
  fails the build, so the old site stays (spec edge case). `lib/release.ts` maps file
  names to `{ os, kind, name, url }` and lists only the files that exist.
- **System detection (FR-011, FR-013, FR-015).** The HTML lists every build. An inline
  script (allowed by a CSP hash) runs `detectOs()` and sets `data-os` on `<html>`. CSS
  then shows the matching group as the main button. Without scripts, or for an unknown
  system (phones, iPadOS), all builds show with no main one.
- **Guides (FR-006 – FR-008).** An Astro content collection loads `docs/guide/*.md`. The
  file name gives the slug and the language (`install.uk.md` → `uk`, `install`). A remark
  plugin calls `rewriteGuideLink()`:
  - another guide → its page on the website, in that guide's language;
  - `#anchor` → unchanged (Astro uses the same slugger as GitHub);
  - another repository file → `${SOURCE_URL}<path>`;
  - an absolute URL → unchanged.
  A guide with no translation fails the build (edge case).
- **URLs.** `src/shared/project.ts` gets `SITE_URL`, `SOURCE_URL` (a repository file on
  `main`) and `releaseFileUrl(tag, name)`, with root unit tests. Astro `site` and `base`
  come from `SITE_URL`.
- **SEO (FR-040 – FR-042).** One `BaseLayout` writes `<html lang>`, title, description,
  canonical, `hreflang` for both languages plus `x-default`, Open Graph and Twitter
  tags. The preview image is the board screenshot of the page language. `sitemap.xml`
  and `robots.txt` are endpoints.
- **Theme (NFR-003).** CSS tokens from `docs/brand.md` on `:root`, the dark values under
  `prefers-color-scheme: dark`. System font stack, no web fonts (NFR-001).

## Project structure

```
website/
├── package.json, package-lock.json   # astro, vitest, @vitest/coverage-v8, playwright, axe, eslint
├── astro.config.mts        # site/base from SITE_URL, vite fs.allow for ../docs, ../assets, ../src/shared
├── tsconfig.json           # extends astro/tsconfigs/strict
├── eslint.config.mjs
├── vitest.config.mts       # tests/unit (coverage ≥ 80 % on src/lib, src/i18n) and tests/built
├── playwright.config.ts    # astro preview as webServer; Chromium only
├── src/
│   ├── content.config.ts   # guides collection: glob loader over ../docs/guide
│   ├── lib/                # pure, unit-tested
│   │   ├── os.ts           # detectOs(userAgent, platform, maxTouchPoints)
│   │   ├── release.ts      # release JSON → download list; version label
│   │   ├── guides.ts       # file id → { slug, lang }; guide list and order
│   │   ├── guideLinks.ts   # rewriteGuideLink(href, lang) + remark plugin
│   │   └── paths.ts        # page path for a lang and slug; the other-language path
│   ├── data/release.ts     # build-time fetch of the latest release
│   ├── i18n/               # en.ts, uk.ts (typed as en), index.ts
│   ├── layouts/BaseLayout.astro
│   ├── components/         # Header, Footer, LanguageSwitch, Download, Feature, Screenshot
│   ├── styles/global.css   # tokens, reset, layout
│   └── pages/
│       ├── index.astro, uk/index.astro          # home (thin wrappers over HomePage)
│       ├── guide/[slug].astro, uk/guide/[slug].astro
│       └── sitemap.xml.ts, robots.txt.ts
└── tests/
    ├── unit/               # lib/, i18n key parity
    ├── built/              # built HTML: links, lang, hreflang, privacy, downloads
    └── browser/            # Playwright: axe, keyboard, system detection, 360 px
.github/workflows/site.yml  # build + deploy to Pages
```

`website/package.json` scripts: `dev`, `build`, `preview`, `lint` (ESLint + `astro
check`), `test`, `test:coverage`, `test:built` (after `build`), `test:browser`.

## Key decisions

### D-1 — The website is a separate package in `website/`

- **Options considered:** Astro as a root dev dependency; `website/` with its own
  `package.json` and lockfile.
- **Chosen:** a separate package (owner, 2026-11-23).
- **Why:** The app and the website have different dependencies, tests and release
  cycles. The app's `npm ci`, lint, coverage and Dependabot updates do not change.

### D-2 — Release data at build time, not in the browser

- **Options considered:** fetch the GitHub API from the page; fetch at build time.
- **Chosen:** build time; the release workflow is not touched, a `release: published`
  event rebuilds the site (FR-032).
- **Why:** No request to a third party from the visitor's browser (NFR-001), links work
  without scripts (FR-015), no API rate limit for visitors.

### D-3 — Site strings in `website/src/i18n/`, not in `locales/`

- **Why:** `locales/*.json` is bundled into the app; site copy there would ship to every
  user. The `uk` object is typed as the `en` object, so a missing key is a type error;
  a unit test also checks it.

### D-4 — Separate workflow `site.yml` for deploy; a `Website` job in `ci.yml` for PRs

- **Why:** FR-033 needs a check on every PR. The deploy needs `pages: write` and
  `id-token: write`, which CI does not need.

### D-5 — CI runs only the checks for the changed part; one required check

- **Problem:** a PR that changes only the website must not run the desktop checks
  (quality gate and E2E + package on three systems), and a desktop PR must not build the
  website. But `paths` filters on the workflow do not work with required checks: a
  check that does not start stays "Expected" and blocks the merge.
- **Options considered:**
  1. Two workflows with `paths` / `paths-ignore` — blocks merges as above.
  2. Job-level `if` in one workflow, the same required checks — a skipped matrix job
     reports one check with the name not expanded, so `E2E + package (ubuntu-latest)`
     stays "Expected".
  3. Job-level `if` in one workflow plus one aggregate job `CI result` that is the only
     required check.
- **Chosen:** 3.
- **How:**
  - Job `Changes` (first): lists the files of the PR and gives them to
    `scripts/ci-changes.mjs` (unit-tested). It sets two outputs:
    - `desktop` — app code or config changed (`src/`, `e2e/`, `tests/`, `scripts/`,
      `build/`, `locales/`, `skills/`, `assets/`, package, TypeScript, build, test, lint
      and format configs);
    - `website` — a file in `website/`, `docs/guide/`, `docs/screenshots/`,
      `assets/logo.svg`, `src/shared/project.ts` or `site.yml` changed.
    A change of `ci.yml` or of the script sets both. Docs, specs and templates set
    neither, so they run no checks.
  - `Quality gate` and `E2E + package` run if `desktop`; `Website` runs if `website`.
  - `CI result` runs `if: always()`, needs all jobs, and fails if one of them failed or
    was cancelled. A skipped job is a pass.
  - Branch protection requires only `CI result` (owner changes the ruleset once, T063).
- **Result:** a website PR runs `Changes`, `Website` and `CI result`. A desktop PR runs
  the same checks as today. A PR that changes `project.ts` or the logo runs both. A
  PR with only docs or specs runs `Changes` and `CI result`.

## Risks

| Risk | Mitigation |
|------|------------|
| GitHub Pages paths are case-sensitive (`/Findy/` ≠ `/findy/`) | `base` comes from `SITE_URL`; a built-HTML test checks that every internal link starts with it |
| API rate limit in CI | `GITHUB_TOKEN` in the build step |
| A release without one of the files | `lib/release.ts` lists only files that exist; a test covers a partial release |
| Guide text uses GitHub-only Markdown (alerts, relative images) | The current guides use neither; the link test fails on a relative link that the site cannot resolve |
| Files from outside `website/` (guides, screenshots, `project.ts`) | `vite.server.fs.allow` includes them; the deploy workflow triggers on their paths too |
| Pages is not enabled for the repository | One-time step after merge: Pages source "GitHub Actions" and the repository homepage (FR-034); in `docs/release.md` |
