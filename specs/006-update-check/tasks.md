# Tasks: Update check

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

## Phase 0 — Constitution

- [x] T000 Amendment §II.6 in a separate branch and PR with the `constitution` label (D-1)

## Phase 1 — Main and domain

- [x] T001 Domain `updates.ts`: version compare (SemVer), check due after 24 h; unit tests (FR-004, FR-006)
- [x] T002 Settings rows `autoUpdateCheck`, `lastUpdateCheckAt`; IPC `setAutoUpdateCheck`; tests (FR-002, FR-004)
- [ ] T003 `main/updates.ts`: fetch and validate the latest release, timeout, size limit, URL check, one request at a time; IPC `checkForUpdates`, error code `NETWORK`; tests (FR-003…FR-006, FR-009…FR-012)

## Phase 2 — UI

- [ ] T010 App menu: "Check for updates…", "Check for updates automatically"; `UpdateDialog`; auto check at start; dialog waits for other dialogs; en/uk (FR-001, FR-002, FR-007…FR-010)

## Phase 3 — Verification and docs

- [ ] T020 e2e: local release server; US-1, US-2 scenarios; no request when off (SC-001); axe
- [ ] T021 Docs: ipc.md, data-model.md, security.md, architecture.md (D-10)
