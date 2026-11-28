# Implementation Plan: Polish documentation and website

- **Spec:** [spec.md](spec.md) · **Architecture:** [docs/architecture.md](../../docs/architecture.md) (D-19)
- **Status:** Approved

## Summary

Docs: `README.pl.md` and `docs/guide/*.pl.md`, with language links in every README. Website:
`pl` joins `LANGS` (`website/src/lib/paths.ts`), which drives the language menu, the
guide ids, `hreflang`, the sitemap and the browser tests. New `website/src/i18n/pl.ts`, pages
`pages/pl/index.astro` and `pages/pl/guide/[slug].astro`, Polish screenshots and the
`og:locale` map. Screenshots come from `e2e/self-tests/readme-screenshots.test.ts` with Polish
demo data. App: `extensionGuideUrl('pl')`.

## Constitution check

| Principle | Complies? | Notes |
|-----------|-----------|-------|
| I. Spec first | Yes | Spec 027 approved 2026-11-28 |
| II. Local-first | Yes | Static pages; the app opens the guide in the browser |
| III. Secure Electron | Yes | Only a URL builder changes in the app |
| IV. Cross-platform | Yes | Docs and website |
| V. i18n | Yes | Polish website texts in `website/src/i18n/pl.ts` (D-19: not in `locales/`) |
| VI. Tested | Yes | Website unit, built and browser tests run for every language; app unit test for the guide URL |
| VII. Simplicity | Yes | Data and pages; the menu already lists `LANGS` |
| VIII. Accessible | Yes | The browser tests run axe on the Polish pages |

## Requirement → component

| Requirement | Component |
|-------------|-----------|
| FR-001 | `README.pl.md`, language lines in `README.md`, `README.uk.md` |
| FR-002, FR-007 | `docs/guide/*.pl.md`; `website/src/lib/guides.ts#missingGuides` over `LANGS` |
| FR-003, FR-005 | `website/src/lib/paths.ts`, `i18n/pl.ts`, `pages/pl/`, `layouts/BaseLayout.astro` |
| FR-004 | `docs/screenshots/*-pl.png`, `components/HomePage.astro`, `Features.astro` |
| FR-006 | `src/shared/extension.ts#extensionGuideUrl` |

## Key decisions

- **D-1** `otherLang` goes away: with three languages there is no single "other"; the menu
  lists `LANGS`, and the tests use the list.
- **D-2** Screenshot data in Polish follows the English and Ukrainian demo boards.

## Risks

- **Translation quality** — the PR lists the terms (spec NFR-002).
