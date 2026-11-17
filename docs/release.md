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

`better-sqlite3` is a native module. `postinstall` runs
`electron-builder install-app-deps` to rebuild it for Electron. Each OS is built
on its own runner; macOS builds arm64 and x64 separately so each `.dmg` gets the
right binary. Cross-compiling Windows/Linux builds from macOS is not supported.

## CI — `.github/workflows/ci.yml`

On every push and PR: `npm ci` → lint → type-check → unit tests → e2e tests
(Linux under `xvfb-run`) → `electron-builder --dir` smoke build on all three OSes.

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
