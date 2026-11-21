# Builds & releases

## Versioning

SemVer. `package.json` `version` is the source of truth. Pre-1.0 while the MVP
is in progress (`0.x.y`).

## Targets (electron-builder)

| OS | Arch | Artifacts | CI runner |
|----|------|-----------|-----------|
| Windows | x64 | NSIS installer `.exe` | `windows-latest` |
| macOS | arm64, x64 | `.dmg` (one per arch) | `macos-latest` |
| Linux | x64 | `.AppImage`, `.deb` | `ubuntu-latest` |

## Native modules

`better-sqlite3` is the only native module. It ships Node-API prebuilds for
every target platform/arch, so nothing is compiled or rebuilt
(`npmRebuild: false`, architecture D-2). Each OS is still packaged on its own CI
runner, and `npm run smoke:packaged` launches the unpacked build with
`FINDY_SMOKE_TEST=1` to prove it can open a SQLite database.

## CI — `.github/workflows/ci.yml`

On every pull request (opened, or a new push to it). Not after a merge to `main`:
branch protection lets only PRs that passed these checks in.

1. **Quality gate** (Ubuntu): `format:check` → `lint` (ESLint + tsc) →
   `test:coverage`. Coverage thresholds are **80 %** for lines, branches,
   functions and statements (`vitest.config.ts`); below that the job fails.
   A coverage table is published in the job summary.
2. **E2E + package** (Windows, macOS, Linux; runs after the gate):
   `test:e2e:ci` (Linux: one Xvfb display started and checked before the tests) → `dist:dir` → `smoke:packaged`.

**Flaky policy** (`scripts/e2e-ci.mjs`): the run has no retries. At the end, only
the failed tests run once more (`playwright test --last-failed`).

- A test that passes on the rerun is **flaky**: the job stays green, and the test is
  listed as a warning on the PR and in the job summary. Fix it in the same PR or
  open an issue; a test that stays flaky gets the `@quarantine` tag (the kit skips
  it, `E2E_QUARANTINE=include` runs it) until it is fixed.
- A test that fails again is a real failure: the job is red.
- When a test failed, the job uploads the artifact `e2e-traces-<os>` (14 days): the
  traces of the first run in `e2e-traces/first-run/` and of the rerun in
  `test-results/`. Read the trace (`npx playwright show-trace <trace.zip>`) before a fix.

Coverage scope: `src/domain`, `src/main` (except the entry points
`src/main/index.ts` and `src/main/mcp/cli.ts`) and `src/shared`. UI and preload are covered by e2e tests.

Branch protection on `main` requires all four checks (`Quality gate …` and
`E2E + package` on Ubuntu, Windows and macOS), linear history, and forbids force
pushes and deletion. Pull requests are merged with squash.

Performance (NFR-002, NFR-003) is an e2e spec with 1 000 applications and 10 000
notes (`e2e/specs/performance.spec.ts`, tag `@perf`); limits are 3× on CI runners.

## Release — `.github/workflows/release.yml`

Release notes start with "Which file to download" (`.github/release-downloads.md`,
`VERSION` replaced), then the version's section of `CHANGELOG.md`. The macOS disk
images are renamed to `…-macOS-Apple-Silicon.dmg` and `…-macOS-Intel.dmg`.

Until there is a Developer ID, macOS builds are signed **ad hoc**
(`mac.identity: '-'`, hardened runtime off). An unsigned bundle with only the
Electron binary's linker signature is "damaged" on Apple Silicon after a
download, with no way to open it. `smoke:packaged` runs
`codesign --verify --deep --strict` on macOS to catch this.


1. Maintainer bumps version, updates `CHANGELOG.md`, merges to `main`.
2. Pushes tag `vX.Y.Z`.
3. Matrix job builds on the three runners and uploads the files to a **draft**
   GitHub Release: two `.dmg`, the Windows installer and the portable ZIP (spec 012),
   the AppImage and the `.deb`. Each runner records a build provenance attestation
   for its files (`actions/attest-build-provenance`).
4. The `checksums` job downloads every file of the draft and uploads
   `SHA256SUMS.txt`.
5. Maintainer smoke-tests each artifact (also: **Save skill…** in the app and upload the
   archive in Claude Desktop once, spec 016), then publishes the release.
6. Within a day, the [Homebrew tap](https://github.com/YuraBerez/homebrew-findy) and the
   [Scoop bucket](https://github.com/YuraBerez/scoop-findy) move to the published
   version: their daily workflow checks the files against `SHA256SUMS.txt` and commits
   the new version and sums. Run their "Follow Findy releases" workflow by hand to do
   it at once. They never read a draft or a pre-release.

Users can check a download with `SHA256SUMS.txt` or
`gh attestation verify <file> --repo YuraBerez/findy` (README → Check a download).

## Signing

Not yet (architecture D-5, spec 012 D-4, D-5). The README explains the first start:
macOS "Open Anyway" in Privacy & Security, Windows SmartScreen "More info → Run
anyway". The Homebrew cask shows the same steps and does not remove the quarantine.

### Turning on macOS signing and notarisation (when there is an Apple Developer ID)

1. Join the Apple Developer Program; create a **Developer ID Application** certificate
   and export it with its key as a `.p12`.
2. Create an App Store Connect API key (Users and Access → Integrations) with the
   Developer role.
3. Add the repository secrets: `CSC_LINK` (the `.p12`, base64), `CSC_KEY_PASSWORD`,
   `APPLE_API_KEY` (the `.p8` content), `APPLE_API_KEY_ID`, `APPLE_API_ISSUER`.
4. In `electron-builder.yml`: remove `identity: '-'`, set `hardenedRuntime: true` and
   `notarize: true`, and add the entitlements Electron needs
   (`com.apple.security.cs.allow-jit`, `allow-unsigned-executable-memory`).
5. In `release.yml`: stop setting `CSC_IDENTITY_AUTO_DISCOVERY: false` on macOS, and
   write `APPLE_API_KEY` to a file for electron-builder.
6. Check a build on a Mac that never ran Findy: it opens with no warning, and
   `spctl -a -vv /Applications/Findy.app` says *Notarized Developer ID*. Then the cask
   can drop its caveats and go to the official `homebrew/cask`.

### Turning on Windows signing (SignPath Foundation)

1. Apply for the free open-source program at signpath.org with the repository link;
   the project must build its releases in public CI (it does).
2. After approval, add the SignPath organization, project and signing policy, and the
   `SIGNPATH_API_TOKEN` secret.
3. In `release.yml`, after the Windows build: upload the unsigned `.exe` and `.zip`
   as a workflow artifact and call `signpath/github-action-submit-signing-request`;
   upload the signed files to the release instead of the unsigned ones.
4. Check that the files show the publisher in their properties. SmartScreen warnings
   go away as the signed files gain reputation.
