# Tasks: Share analytics as an image

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

Legend: `[P]` — can run in parallel with other `[P]` tasks in the same phase.
Each task references the requirement(s) it satisfies.

## Phase 1 — Main and IPC

- [x] T001 Tests, then `main/image.ts#createImageSharer`: copy decodes and writes the
      clipboard; save picks the path with `findy-analytics-YYYY-MM-DD.png`, writes the bytes,
      cancel gives `cancelled`, a failed write rejects (FR-021, FR-022, FR-023, plan D-6)
- [x] T002 Tests, then `PngSchema` and the handlers `copyImage`, `saveImage` in
      `main/ipc.ts`; channels and types in `shared/ipc.ts`; wiring in `main/app/services.ts`;
      `docs/contracts/ipc.md`, `docs/security.md` (FR-021…FR-023, NFR-004, plan D-2)

## Phase 2 — The image

- [x] T010 [P] Tests, then `shareImage/palette.ts`: light colours equal to `global.css`,
      text contrast ≥ 4.5 : 1 (FR-014, NFR-002, plan D-3)
- [x] T011 [P] Tests, then `shareImage/content.ts`: title, subtitle, period, tiles, funnel
      rows in the active language and locale formats (FR-011…FR-013, FR-015)
- [x] T012 Tests for `fitFontSize`, then `shareImage/draw.ts`: 1080 × 1080 PNG, logo,
      tiles, funnel, website address (FR-010, FR-011, FR-016, plan D-4)
- [x] T013 Strings `analytics.share.*` in `en.json` and `uk.json` (NFR-001)

## Phase 3 — User stories 1–3 (P1, P2)

- [x] T020 e2e screen and spec for US-1…US-3 (all acceptance scenarios, SC-002)
- [x] T021 `ImageIcon` in `@ui`; button in the filter row of `Analytics`, hidden in the
      empty state (FR-001…FR-003)
- [x] T022 `ShareImageDialog`: preview with a text alternative, Copy, Save as PNG, Close;
      `useAppState` actions; confirmation and errors (FR-020…FR-025, plan D-5)
- [x] T023 e2e axe audit of the preview in both themes (NFR-002)

## Phase 4 — Polish

- [x] T090 `docs/architecture.md`: project structure and decision D-20 (the CHANGELOG entry
      comes with the release; there is no user guide page for analytics)
- [ ] T091 Full gate: format, lint, coverage ≥ 80 %, e2e
