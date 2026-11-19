# Implementation Plan: Install with Homebrew and Scoop; verifiable releases

- **Spec:** [spec.md](spec.md) · **Architecture:** [docs/architecture.md](../../docs/architecture.md)
- **Status:** Approved

## Summary

No app code changes. The Findy repository adds a portable Windows ZIP to each release,
a `SHA256SUMS.txt`, and build provenance attestations, all in `release.yml`. Two new
public repositories hold the packages: `homebrew-findy` (a cask) and `scoop-findy`
(a manifest). Each has a small scheduled workflow that reads the latest **published**
release of Findy, downloads its files, checks them against the release's
`SHA256SUMS.txt`, and rewrites its package when the version changed. No token crosses
repositories (NFR-001).

## Constitution check

| Principle | Complies? | Notes |
|-----------|-----------|-------|
| I. Spec first | ✅ | Spec 012, approved 2026-11-19 |
| II. Local-first | ✅ | No change to the app; package managers download from GitHub Releases only |
| III. Secure Electron | ✅ | No quarantine removal (spec FR-006); sums and attestations make downloads verifiable |
| IV. Cross-platform | ✅ | macOS (Homebrew), Windows (Scoop); Linux unchanged |
| V. i18n | ✅ | README in en and uk |
| VI. Tested | ✅ | `brew audit` and `brew fetch` of the cask (checks sums); the updaters run once by hand; the release workflow runs on the next tag |
| VII. Simplicity | ✅ | One shell script per package repository, no bots, no cross-repository secrets |
| VIII. Accessible | ✅ | No UI change |

## Requirement → component map

| Requirements | Where |
|--------------|-------|
| FR-003 | `electron-builder.yml`: Windows target `zip` (x64), `Findy-<version>-Windows-portable.zip`; `release.yml` uploads it |
| FR-009 | `release.yml` job `checksums` after the builds: downloads the release files, writes and uploads `SHA256SUMS.txt` |
| FR-010 | `release.yml` build job: `actions/attest-build-provenance` on the installers (`id-token: write`, `attestations: write`) |
| FR-001, FR-006, FR-007 | `homebrew-findy/Casks/findy.rb`: per-architecture `.dmg`, `sha256 arm:/intel:`, caveats with the first-start steps, `zap` paths |
| FR-002, FR-007 | `scoop-findy/bucket/findy.json`: the ZIP, its hash, a Start menu shortcut; no `persist` (data is in `%APPDATA%\Findy`) |
| FR-004, FR-005 | `update.sh` + a daily workflow in each package repository: latest published release, files checked against `SHA256SUMS.txt`, commit only on a new version, fail without a change on any missing file |
| FR-008, FR-011 | README (en, uk) "Download"; `.github/release-downloads.md`; `docs/release.md` (packages, sums, attestations, how to turn on signing) |

## Key decisions

### D-1 — Each package repository updates itself

- **Options considered:** the Findy release workflow pushes to both repositories (needs a
  personal token as a secret in Findy); a scheduled job in each package repository.
- **Chosen:** a scheduled job, daily and on demand, with the repository's own token.
- **Why:** spec NFR-001; and only a published release is ever read (FR-004).

### D-2 — Sums from the release, not from the package repository

- **Why:** the updater compares each download with `SHA256SUMS.txt` of the release
  (FR-009), so a broken download never becomes a package.

## Risks

- **The first release with a ZIP and sums is the next one (0.4.1)** → until then the
  bucket has no manifest, and the tap computes the sums of 0.4.0 itself (no
  `SHA256SUMS.txt` in that release).
- **GitHub repository name case (`Findy` / `findy`)** → URLs use `YuraBerez/findy`, as
  `src/shared/project.ts`; GitHub redirects either way.
