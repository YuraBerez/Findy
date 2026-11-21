# Implementation Plan: A skill for AI assistants that use Findy

- **Spec:** [spec.md](spec.md) · **Architecture:** [docs/architecture.md](../../docs/architecture.md)
- **Status:** Approved

## Summary

The skill is one file, `skills/findy/SKILL.md`, at the repository root. The main process
imports it as text at build time, so the app holds the skill of its own version. A new
IPC call `saveSkill()` asks for a path with the system save dialog and writes a zip with
`findy/SKILL.md` inside. The zip writer is small and uses Node's own CRC-32, so there is
no new dependency. The release workflow packs the same folder with `zip` and uploads it.
The MCP dialog gets a "Skill" section; the README gets the install steps.

## Technical context

| Item | Choice |
|------|--------|
| Skill | `skills/findy/SKILL.md`: YAML front matter (`name`, `description`) + Markdown |
| Bundling | Vite `?raw` import in main: the text is part of `out/main` |
| Archive | `main/skill/zip.ts`: stored entries (no compression), `zlib.crc32` (Node ≥ 22.2) |
| Release | `release.yml`, draft job: `zip -r findy-skill-<version>.zip findy` in `skills/` |
| Testing | Vitest: zip format, tools ↔ skill parity, IPC; e2e: save and the install link |

## Constitution check

| Principle | Complies? | Notes |
|-----------|-----------|-------|
| I. Spec first | ✅ | Spec 016, approved 2026-11-21 |
| II. Local-first | ✅ | The skill is in the app; saving makes no request (NFR-002) |
| III. Secure Electron | ✅ | `saveSkill` takes no input; the path comes from the system dialog in main; the link is a constant from `shared/project.ts` |
| IV. Cross-platform | ✅ | Same bytes on every OS; the save dialog of spec 008 |
| V. i18n | ✅ | New dialog text and the confirmation in en + uk; the skill text is English (spec D-4) |
| VI. Tested | ✅ | Unit: zip, parity, service, IPC; e2e: US-1 |
| VII. Simplicity | ✅ | One file, ~40 lines of zip code, no library |
| VIII. Accessible | ✅ | A button and a link with names, in the dialog's tab order |

## Requirement → component map

| Requirements | Where |
|--------------|-------|
| FR-001…FR-007, NFR-004 | `skills/findy/SKILL.md`; `## Tools` has one `### <tool>` heading per tool |
| NFR-003 | `tests/unit/skill.test.ts`: the `###` headings under `## Tools` equal the names from `createTools`; front matter has `name: findy`; ≤ 500 lines |
| FR-010, FR-012 | `main/skill/` (`index.ts`: `createSkillSaver`, `zip.ts`); the text through `?raw` |
| FR-011 | `.github/workflows/release.yml` draft job; `docs/release.md` |
| FR-020…FR-024 | `features/assistant/McpDialog`: section "Skill"; `useAppState.saveSkill` through `attempt` (spec 003) and a notification; `openLink(SKILL_INSTALL_URL)` |
| FR-021, FR-022 | IPC `saveSkill(): { status: 'saved' } \| { status: 'cancelled' }`; not gated by `mcpEnabled`; works without a database |
| FR-023 | `shared/project.ts#SKILL_INSTALL_URL` (README anchor) |
| FR-030 | `README.md`, `README.uk.md`: section "Install the Findy skill", link from the MCP section |

## IPC contract change

```ts
saveSkill(): Promise<{ status: 'saved' } | { status: 'cancelled' }>  // STORAGE: write failed
```

## Key decisions

### D-1 — The skill text in the main bundle, not a separate resource

- **Options considered:** `extraResources` in electron-builder and a file read at run
  time; a `?raw` import.
- **Chosen:** `?raw`.
- **Why:** no packaging change and no path per OS; the text cannot go missing from an
  install; unit tests read the same file.

### D-2 — Own zip writer

- **Options considered:** a zip library; a 40-line writer of stored entries.
- **Chosen:** the writer. One small text file needs no compression; `zlib.crc32` gives the
  checksum (constitution §VII).

### D-3 — Release archive from the shell

- **Chosen:** `zip` in the release workflow from the same folder.
- **Why:** the format is the same (folder at the root); no build step in the draft job.

## Risks

- **The skill falls behind the tools** → the parity test fails in CI (NFR-003).
- **An upload rejects the zip** → e2e checks the local file header and the entry name;
  a manual check in Claude Desktop before the release (docs/release.md).
