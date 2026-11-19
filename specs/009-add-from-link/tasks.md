# Tasks: Add an application from a link

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

Legend: `[P]` — can run in parallel with other `[P]` tasks in the same phase.
Each task references the requirement(s) it satisfies.

## Phase 0 — Constitution

- [ ] T000 Amendment §II.7 in a separate PR with the `constitution` label (spec D-1); merged before Phase 2

## Phase 1 — Domain

- [x] T001 [P] `domain/vacancy/extract.ts`: JSON-LD `JobPosting` (`@graph`, arrays, organisation as object or string), Open Graph, `<title>`; entities, whitespace, cut to 200; unit tests (FR-004, edge cases)
- [x] T002 [P] `domain/vacancy/charset.ts`: charset from `Content-Type` and `<meta>`; unit tests (edge cases)

## Phase 2 — Main

- [ ] T010 `main/vacancy.ts` `readVacancyPage`: in-memory session, no cookies, manual redirects (≤ 5, http/https), HTML types only, 10 s, 2 MB, decode; unit tests with fake responses (NFR-001, NFR-002, FR-006)
- [ ] T011 IPC `readVacancy` (zod, contract types, preload); tests: valid, invalid link → VALIDATION, failure → `null` (FR-001, FR-006)

## Phase 3 — UI

- [ ] T020 `useApplicationForm.fillEmpty`; `useVacancyFill` (request id, ignore old and unmounted answers) (FR-003, FR-007)
- [ ] T021 `ApplicationDialog`: paste starts a read, "Fill from link" button, status line, message; `ApplicationFields` slot under the link field; en/uk strings (FR-001, FR-002, FR-005, FR-006, FR-008, FR-009, US-3)

## Phase 4 — Verification and docs

- [ ] T030 e2e with a local page server: US-1.1–1.5, US-2.1–2.3, US-3.1–3.2; axe on the dialog with the message (NFR-003, NFR-004, SC-001, SC-002)
- [ ] T031 Docs: contracts/ipc.md, architecture.md (D-12), security.md (outbound network)
