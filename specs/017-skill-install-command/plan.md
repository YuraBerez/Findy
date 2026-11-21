# Implementation Plan: Install the skill with one command

- **Spec:** [spec.md](spec.md) · **Architecture:** [docs/architecture.md](../../docs/architecture.md)
- **Status:** Approved

## Summary

A pure function in `src/shared/skill.ts` builds the two commands from `SKILL_RAW_URL`
(`src/shared/project.ts`). The MCP dialog picks the form from the user agent (Electron's
contains `Windows` on Windows) and shows it in the existing `CodeBlock` with "Copy". The
README gets both lines. The release workflow and the download notes drop the skill archive.
`REPOSITORY` in `project.ts` becomes `YuraBerez/Findy`, the new name of the repository, so
the raw address does not depend on a redirect.

## Constitution check

| Principle | Complies? | Notes |
|-----------|-----------|-------|
| I. Spec first | ✅ | Spec 017, approved 2026-11-21 |
| II. Local-first | ✅ | Findy makes no request; the user runs the command (NFR-002) |
| III. Secure Electron | ✅ | No new IPC; the renderer shows text only |
| IV. Cross-platform | ✅ | A shell form and a PowerShell form (FR-002) |
| V. i18n | ✅ | Block title and hint in en + uk; commands not translated |
| VI. Tested | ✅ | Unit: both commands (URL, folder, temp file then move); e2e: the block and copy |
| VII. Simplicity | ✅ | One function, an existing control |
| VIII. Accessible | ✅ | `CodeBlock` has a labelled copy button |

## Requirement → component map

| Requirements | Where |
|--------------|-------|
| FR-001…FR-003, FR-006 | `shared/skill.ts#skillInstallCommand(os)`: write to `SKILL.md.tmp`, then move over `SKILL.md` only after a good download (`curl -f … && mv`; PowerShell `if ($?)`) |
| FR-004, FR-005, NFR-003 | `features/assistant/McpDialog`: block "Claude Code" in the "Skill" section, `CodeBlock` |
| FR-007 | `README.md`, `README.uk.md` |
| FR-008 | `.github/workflows/release.yml`, `.github/release-downloads.md`, `docs/release.md`, `docs/architecture.md` D-15 |

## Risks

- **Windows PowerShell 5.1** parses pages with Internet Explorer by default →
  `-UseBasicParsing`.
- **The main branch is ahead of a release** → spec D-2; the README says to update Findy.
