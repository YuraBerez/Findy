# Tasks: Browser extension in the settings

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

## Phase 1 — Links

- [x] T001 Tests, then `extensionFileUrl(version, browser)` and `extensionGuideUrl(language)` in
      `src/shared/extension.ts`; names checked against `release.yml`, guide files in both
      languages (FR-003, FR-004, plan D-1, D-2)

## Phase 2 — UI

- [x] T010 Strings in `en.json` and `uk.json` (NFR-001)
- [x] T011 `features/extension/ExtensionSettings` and the `extension` category; `getAppInfo`
      action (FR-001…FR-004)
- [x] T012 e2e: the category, the text, each button opens its link (both languages), keyboard,
      axe (US-1…US-3, NFR-002)

## Phase 3 — Docs

- [x] T090 `docs/architecture.md` project structure; the browser extension guide mentions the
      settings page
- [ ] T091 Full gate: format, lint, coverage ≥ 80 %, e2e
