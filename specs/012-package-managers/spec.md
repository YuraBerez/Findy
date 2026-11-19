# Feature Spec: Install with Homebrew and Scoop; verifiable releases

- **ID:** 012-package-managers
- **Status:** Implemented (0.4.1)
- **Approved:** 2026-11-19 (owner)
- **Created:** 2026-11-19
- **Builds on:** [001-mvp-board](../001-mvp-board/spec.md) (FR-070…FR-072 installers), [006-update-check](../006-update-check/spec.md)

## Summary

Findy's installers are not signed with an Apple Developer ID or a Windows code-signing
certificate, so they cannot go into the official Homebrew and winget catalogues. Many
developers install tools with a package manager and keep them up to date with one
command. Findy gets its own, open Homebrew tap (macOS) and Scoop bucket (Windows):
public repositories that point at the files of each published GitHub release. The
first start stays as it is today: the system asks once, and the README explains how
to open the app. Nothing turns off a system security check for the user.

## User stories

### US-1 — Install and update on macOS with Homebrew (P1)

As a macOS user, I want to install Findy with Homebrew and update it with `brew upgrade`.

**Acceptance scenarios**

1. **Given** Homebrew, **When** I run `brew tap yuraberez/findy` and
   `brew install --cask findy`, **Then** the Findy of the latest published release for my
   Mac (Apple Silicon or Intel) is installed in Applications.
2. **When** the install ends, **Then** Homebrew shows how to open an unsigned app the
   first time (the same steps as the README).
3. **Given** a newer release is published, **When** a day has passed and I run
   `brew upgrade --cask findy`, **Then** I get the new version.
4. **When** I run `brew uninstall --cask findy`, **Then** the app is removed and my data
   stays; `--zap` also removes the data, as Homebrew users expect.

### US-2 — Install and update on Windows with Scoop (P1)

As a Windows user, I want to install Findy with Scoop and update it with `scoop update`.

**Acceptance scenarios**

1. **Given** Scoop, **When** I run `scoop bucket add findy <bucket address>` and
   `scoop install findy`, **Then** Findy of the latest published release is installed
   for my user, with a Start menu shortcut, and no administrator rights.
2. **Given** a newer release is published, **When** a day has passed and I run
   `scoop update findy`, **Then** I get the new version, and my data stays.
3. **When** I run `scoop uninstall findy`, **Then** the app is removed and my data stays.

### US-3 — Check that a download is genuine (P2)

As a careful user, I want to check that the file I downloaded is the one the project
built, because the installers are not signed yet.

**Acceptance scenarios**

1. **Given** a release, **Then** it has a file with the SHA-256 sum of every installer,
   and the README shows how to compare a download with it.
2. **Given** an installer, **When** I run `gh attestation verify <file> --repo
   YuraBerez/findy`, **Then** GitHub confirms that the project's release workflow built
   it from a commit of the repository.

### US-4 — Find out how to install (P1)

1. **Given** the README (English and Ukrainian), **Then** the "Download" section shows
   the Homebrew and Scoop commands next to the direct downloads, and says that the
   first start still needs the steps of "First start".
2. **Given** the notes of a release, **Then** they mention the two commands.

## Functional requirements

- **FR-001** A public repository `homebrew-findy` (the tap) MUST hold a cask `findy`
  that installs the `.dmg` of the published release for the Mac's architecture, checked
  by its SHA-256.
- **FR-002** A public repository `scoop-findy` (the bucket) MUST hold a manifest `findy`
  that installs a portable Windows build of the published release, checked by its
  SHA-256, with a Start menu shortcut.
- **FR-003** Each release MUST include a portable Windows archive (a ZIP of the app)
  next to the installer, for Scoop.
- **FR-004** The tap and the bucket MUST follow only **published** releases (never a
  draft or a pre-release), and MUST be updated within 24 hours of the publication
  without a manual step.
- **FR-005** An update MUST change the version, the download addresses and the
  SHA-256 sums together, and MUST fail without a change when a file is missing or its
  sum cannot be computed.
- **FR-006** Neither the cask nor the manifest MUST remove the system's download
  quarantine or skip a security check. The cask MUST show the first-start steps as
  its notes (caveats).
- **FR-007** Uninstalling MUST keep the user's data; only Homebrew's `--zap` removes it.
- **FR-008** The README (en, uk), `docs/release.md` and the release notes MUST describe
  both ways to install and how the tap and the bucket are updated.
- **FR-009** Each release MUST include `SHA256SUMS.txt` with the SHA-256 sum of every
  installer and archive in it.
- **FR-010** The release workflow MUST create a build provenance attestation for every
  installer and archive (GitHub Artifact Attestations), verifiable with
  `gh attestation verify`.
- **FR-011** `docs/release.md` MUST describe how to turn on code signing later: Apple
  Developer ID with notarisation for macOS, and SignPath Foundation for Windows, with
  the secrets and the configuration changes each one needs.

## Non-functional requirements

- **NFR-001** No new secret in the Findy repository: the tap and the bucket update
  themselves with their own permissions.
- **NFR-002** The automation is open: anyone can read how the tap and the bucket are
  built and verify the sums against the release files.

## Edge cases

- A release is published with a missing file (for example, the Intel `.dmg`) → the
  update fails and leaves the previous version in place; a maintainer fixes the release.
- Two releases in one day → the tap and the bucket go to the latest one.
- A release is unpublished (back to draft) → nothing changes until the next published
  one; the tap and the bucket never go back to an older version by themselves.
- The user installed Findy from the `.dmg` or the installer before → Homebrew and Scoop
  install their own copy; the data (in the user's data folder) is shared.

## Out of scope

- The official Homebrew catalogue, winget, Chocolatey, Snap, Flatpak.
- Code signing and notarisation themselves: macOS waits for an Apple Developer
  membership (D-4); Windows waits for the SignPath Foundation application (D-5). A later
  spec turns them on.
- Updating Findy from inside the app (spec 006 only tells about new versions).
- Linux package repositories (the `.deb` and AppImage stay direct downloads).

## Success criteria

- **SC-001** A user installs Findy with two commands on macOS or Windows.
- **SC-002** One day after a release is published, `brew upgrade` and `scoop update`
  give the new version.

## Decisions

- **D-1** Own tap and bucket, not the official catalogues: those require signed (and,
  on macOS, notarised) apps (owner, 2026-11-19).
- **D-2** Windows through Scoop, the same open way as Homebrew (owner, 2026-11-19).
- **D-3** Defaults chosen without a question (change them before approval if needed):
  repository names `homebrew-findy` and `scoop-findy` under the owner's account; a daily
  scheduled update in each of them that reads the latest published release (no token in
  the Findy repository); a portable ZIP for Scoop; the quarantine stays (FR-006).

- **D-4** macOS stays unsigned (ad hoc) for now; signing and notarisation come when the
  owner joins the Apple Developer Program (owner, 2026-11-19).
- **D-5** Windows: the owner applies to SignPath Foundation (free signing for open
  source); until it is approved, the builds stay unsigned (owner, 2026-11-19).
- **D-6** Homebrew installs honestly: no quarantine removal; the first start uses "Open
  Anyway", as the caveats say (owner, 2026-11-19).
- **D-7** Free now: `SHA256SUMS.txt` and GitHub Artifact Attestations in every release
  (owner, 2026-11-19).

## Open questions

None.
