# Tasks: Install with Homebrew and Scoop; verifiable releases

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

## Phase 1 — Findy repository

- [ ] T001 Windows portable ZIP target; upload it with the other files (FR-003)
- [ ] T002 `SHA256SUMS.txt` job and build provenance attestations in `release.yml` (FR-009, FR-010)
- [ ] T003 README (en, uk), `.github/release-downloads.md`, `docs/release.md`: Homebrew, Scoop, checking a download, how to turn on signing (FR-008, FR-011)

## Phase 2 — Package repositories

- [ ] T010 `homebrew-findy`: cask for 0.4.0, caveats, zap; `update.sh` + daily workflow; README; `brew audit` and `brew fetch` pass (FR-001, FR-004…FR-007)
- [ ] T011 `scoop-findy`: manifest template, `update.sh` + daily workflow; README; the manifest appears with the first release that has a ZIP (FR-002, FR-004, FR-005, FR-007)

## Phase 3 — Release

- [ ] T020 Release 0.4.1 with the ZIP, sums and attestations; run both updaters; install check on Windows by the owner (SC-001, SC-002)
