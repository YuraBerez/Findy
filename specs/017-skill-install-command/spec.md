# Feature Spec: Install the skill with one command

- **ID:** 017-skill-install-command
- **Status:** Approved
- **Approved:** 2026-11-21 (owner)
- **Author(s):** owner
- **Created:** 2026-11-21
- **Builds on:** [016-mcp-skill](../016-mcp-skill/spec.md) (the skill, "Save skill…", README section)
- **Replaces:** spec 016 FR-011 and US-2.1 (the skill archive in every release)

## Summary

Spec 016 gives the skill as a zip file: the user saves it, unzips it and puts the folder
in the right place. For Claude Code this is more work than needed. The skill changes
rarely, so one terminal command can download it straight from the repository into Claude
Code's skills folder. The MCP dialog shows that command for the user's system, with a
"Copy" button; the README shows it for every system. Running the command again updates
the skill. Claude Desktop and claude.ai accept only an uploaded zip, so "Save skill…"
stays. The release no longer attaches a skill archive.

## User stories

### US-1 — Copy the install command from the app (Priority: P1)

As a Claude Code user, I want to install the skill with one command, without files to
unzip.

**Acceptance scenarios**

1. **Given** the dialog "AI assistant access" on macOS or Linux, **Then** the "Skill"
   section shows a "Claude Code" block with a shell command and a "Copy" button.
2. **Given** the same dialog on Windows, **Then** the block shows a PowerShell command.
3. **When** I click "Copy", **Then** the command is on the clipboard and the button says
   that it was copied.
4. **When** I run the command in a terminal, **Then** the skill is in Claude Code's
   personal skills folder, and Claude Code finds it at the next start.
5. **Given** an older copy of the skill in that folder, **When** I run the command again,
   **Then** the skill is replaced with the current one.
6. **Given** assistant access is off, **Then** the block still shows.

### US-2 — The command in the README (Priority: P1)

As a user who reads the README first, I want the same command there.

**Acceptance scenarios**

1. **Given** the README (English and Ukrainian), **Then** the section "Install the Findy
   skill" shows the command for macOS and Linux and the command for Windows, before the
   other ways.
2. The section says that running the command again updates the skill.

## Functional requirements

- **FR-001** The command MUST download the skill file from the main branch of the
  project repository and write it as the skill `findy` in Claude Code's personal skills
  folder of the current user. It MUST create the folders that are missing and replace an
  existing skill file.
- **FR-002** There MUST be two forms: one for macOS and Linux shells, one for Windows
  PowerShell. Each MUST be one line that a user can paste.
- **FR-003** If the download fails, the command MUST stop with an error and MUST NOT leave
  an empty or partial skill file in place of a working one.
- **FR-004** The dialog "AI assistant access" MUST show, in its "Skill" section, a block
  "Claude Code" with the form for the operating system that Findy runs on, and a "Copy"
  button (the same control as the connection blocks of spec 004).
- **FR-005** The block MUST show whether assistant access is on or off.
- **FR-006** The address in the command MUST come from the project's one place for
  repository links, so a rename changes one line.
- **FR-007** README (English) and README.uk (Ukrainian) MUST show both forms in the
  section of spec 016 US-3, and say that a second run updates the skill.
- **FR-008** The release workflow MUST NOT attach a skill archive any more (replaces spec
  016 FR-011). The download notes MUST NOT link to one.
- **FR-009** "Save skill…" (spec 016 FR-020…FR-022) MUST stay, for Claude Desktop and
  claude.ai.

## Non-functional requirements

- **NFR-001** New UI text in English and Ukrainian (constitution §V). The commands are
  not translated.
- **NFR-002** Findy itself makes no network request for this feature: the user runs the
  command (constitution §II).
- **NFR-003** The block and the "Copy" button work by keyboard and have accessible names
  (constitution §VIII).

## Edge cases

- The main branch describes a tool that the user's Findy version does not have yet: the
  assistant gets an "unknown tool" error and tells the user (spec D-2). The README says
  to update Findy in that case.
- No network: the download fails (FR-003); the old skill stays.
- The user's home folder path has spaces (Windows): the command still works.
- Other agents with Agent Skills: the README tells the user to change the target folder.

## Out of scope

- A command for Claude Desktop or claude.ai (they accept only an upload).
- A command for Windows `cmd.exe`.
- Installing the skill from the app without a terminal.
- A Claude Code plugin.
- A skill pinned to the Findy version (decision D-2).

## Success criteria

- **SC-001** A Claude Code user installs the skill in under 30 seconds: copy, paste, run.

## Decisions

- **D-1** The command in the README and in the MCP dialog, for the current system (owner,
  2026-11-21).
- **D-2** The file comes from the main branch, not from a version tag: one fixed command,
  and the skill changes rarely (owner).
- **D-3** No skill archive in the release; "Save skill…" stays for Claude Desktop and
  claude.ai (owner).

## Open questions

None.
