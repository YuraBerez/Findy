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
3. Matrix job builds on the three runners and uploads artifacts to a **draft**
   GitHub Release (`electron-builder --publish always`, `GH_TOKEN`).
4. Maintainer smoke-tests each artifact, then publishes the release.

## Signing

Not in MVP (architecture D-5). README explains:
- macOS: right-click → Open, or `xattr -dr com.apple.quarantine /Applications/Findy.app`.
- Windows: SmartScreen → "More info" → "Run anyway".

When signing is added, secrets go to GitHub Actions secrets
(`CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`).
