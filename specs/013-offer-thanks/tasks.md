# Tasks: Congratulate on an offer and ask for support

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

Legend: `[P]` — can run in parallel with other `[P]` tasks in the same phase.
Each task references the requirement(s) it satisfies.

## Phase 1 — Domain and storage

- [x] T001 [P] `domain/offer.ts`: `asksAboutOffer`; unit tests: to Offer, Offer → Offer, to other stages, answered (FR-001, FR-002)
- [x] T002 [P] `Settings.offerQuestionAnswered`: store parse and set, IPC `answerOfferQuestion`; tests: default, invalid row, reset keeps it (FR-004, NFR-002)
- [x] T003 [P] `SUPPORT_URL` in `shared/project.ts`; native Help menu **Support Findy…**; menu template test; en/uk (FR-006, FR-007)

## Phase 2 — UI

- [x] T010 `useAppState`: open the dialog after a confirmed move to Offer; wait for the details panel (FR-001, plan D-3)
- [x] T011 `features/support/OfferDialog`: three steps, links, Esc = Not now, focus; en/uk (FR-003, FR-008, FR-009)
- [x] T012 Toolbar ⋯ menu: **Support Findy…** (FR-007)

## Phase 3 — Verification and docs

- [ ] T020 e2e: US-1 scenarios 1–6 (drag, keyboard, details panel), CSV import and MCP do not open it, US-2; axe on the dialog in both themes; uk at 800 × 600 (SC-001, SC-002)
- [ ] T021 Docs: data-model.md (settings row), contracts/ipc.md, contracts/database.md (settings keys)
