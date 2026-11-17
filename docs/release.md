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

On every push to `main` and every PR:

1. **Quality gate** (Ubuntu): `format:check` → `lint` (ESLint + tsc) →
   `test:coverage`. Coverage thresholds are **80 %** for lines, branches,
   functions and statements (`vitest.config.ts`); below that the job fails.
   A coverage table is published in the job summary.
2. **E2E + package** (Windows, macOS, Linux; runs after the gate):
   `test:e2e` (Linux under `xvfb-run`) → `dist:dir` → `smoke:packaged`.

Coverage scope: `src/domain`, `src/main` (except the Electron bootstrap
`src/main/index.ts`) and `src/shared`. UI and preload are covered by e2e tests.

Branch protection on `main` requires all four checks (`Quality gate …` and
`E2E + package` on Ubuntu, Windows and macOS), linear history, and forbids force
pushes and deletion. Pull requests are merged with squash.

Performance (NFR-002, NFR-003) is an e2e spec with 1 000 applications and 10 000
notes (`e2e/specs/performance.spec.ts`, tag `@perf`); limits are 3× on CI runners.

## Release — `.github/workflows/release.yml`

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
