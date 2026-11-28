# Tasks: Polish language

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

## Phase 1 — Setup

- [ ] T001 Constitution §V.2 and `docs/i18n.md`: Polish (separate `constitution` PR)

## Phase 2 — Language list

- [ ] T010 Tests, then `pl` in `Language`, `SUPPORTED_LANGUAGES`, `LanguageSchema`, the
      repository, `resolveLanguage` (`pl*`), i18n resources, CSV labels, settings names
      (FR-001, FR-002, FR-005, FR-007, FR-009, plan D-1, D-3)
- [ ] T011 Parity test over every locale file, plural forms per language (NFR-001, FR-003)

## Phase 3 — Translation

- [ ] T020 `locales/pl.json` with every key (FR-001, FR-003)
- [ ] T021 Extension `_locales/pl` (FR-008)

## Phase 4 — Tests and polish

- [ ] T030 e2e: switch to Polish, plurals, dates, CSV export and import, 800 × 600, axe
      (US-1…US-3, NFR-002)
- [ ] T090 Docs: architecture, README language line, CHANGELOG with the release
- [ ] T091 Full gate
