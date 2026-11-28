# Implementation Plan: Polish language

- **Spec:** [spec.md](spec.md) · **Architecture:** [docs/architecture.md](../../docs/architecture.md)
- **Status:** Approved

## Summary

Add `pl` to the one language list of the domain (`SUPPORTED_LANGUAGES`, `Language`,
`LanguageSchema`) and add `locales/pl.json` with every key. Everything that reads the list
then gets Polish: the settings select, the CSV labels, i18next resources, the main
translator and the extension `_locales`. `resolveLanguage` maps `pl*` to Polish. i18next
uses `Intl.PluralRules('pl')`, so the `_one`, `_few`, `_many`, `_other` keys work without
code. The constitution change (§V.2) goes in its own PR first.

## Constitution check

| Principle | Complies? | Notes |
|-----------|-----------|-------|
| I. Spec first | Yes | Spec 026 approved 2026-11-28 |
| II. Local-first | Yes | No network change |
| III. Secure Electron | Yes | `LanguageSchema` grows by one value; still validated in main |
| IV. Cross-platform | Yes | `Intl` and i18next only |
| V. i18n | Changes | §V.2 lists `pl`; amended in a separate `constitution` PR (spec 026) |
| VI. Tested | Yes | Parity test for three locales, plural forms, resolve rule, CSV, e2e in Polish |
| VII. Simplicity | Yes | Data, not code: one JSON file and one list |
| VIII. Accessible | Yes | `lang="pl"`; axe audit in Polish |

## Requirement → component

| Requirement | Component |
|-------------|-----------|
| FR-001, FR-004 | `domain/types.ts`, `domain/language.ts`, `domain/schema.ts`, `shared/i18n.ts`, `locales/pl.json`, settings `NAMES` |
| FR-002 | `domain/language.ts#resolveLanguage` |
| FR-003 | `locales/pl.json` plural keys; `tests/unit/i18n.test.ts` checks the forms of each locale with `Intl.PluralRules` |
| FR-005, FR-009 | `main/i18n.ts` (uses the shared resources) |
| FR-006 | spec 023 uses `t` and `i18n.language` (no change) |
| FR-007 | `main/transfer.ts#LANGUAGES` from `SUPPORTED_LANGUAGES` |
| FR-008 | `scripts/build-extension.mjs` writes `_locales/pl` |
| NFR-001 | `tests/unit/i18n.test.ts` over every file in `locales/` |
| NFR-002 | e2e at 800 × 600 in Polish |

## Key decisions

- **D-1** One list: `SUPPORTED_LANGUAGES` is the source; `LanguageSchema`, the CSV labels
  and the settings select read it, so a fourth language changes one line and one file.
- **D-2** The parity test reads every `locales/*.json` and checks the plural keys per
  language with `Intl.PluralRules(lang).resolvedOptions().pluralCategories`.
- **D-3** `settings.language` is stored as text; the repository accepts any supported id.
  No migration.

## Risks

- **Translation quality.** Mitigation: the PR lists the terms for review (spec D-3).
- **Long Polish words** overflow buttons. Mitigation: e2e at the minimum window size.
