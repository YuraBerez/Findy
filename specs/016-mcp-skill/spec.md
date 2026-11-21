# Feature Spec: A skill for AI assistants that use Findy

- **ID:** 016-mcp-skill
- **Status:** Approved
- **Approved:** 2026-11-21 (owner)
- **Author(s):** owner
- **Created:** 2026-11-21
- **Builds on:** [004-mcp-server](../004-mcp-server/spec.md) (tools, access setting, connection dialog),
  [014-application-fields](../014-application-fields/spec.md) (fields in the tools)

## Summary

Findy's MCP server gives an AI assistant tools, but not the knowledge of how to use them
well. An assistant can add a duplicate, guess a company name, or not know which fields an
application has. A skill is a short set of instructions that an assistant loads when the
task needs it. Findy ships one skill in the open Agent Skills format: the tools, four
typical workflows, and safety rules. The user saves it from the app or downloads it from
a release, and installs it with the steps in the README.

## Glossary

| Term | Meaning |
|------|---------|
| **Skill** | A folder with an instructions file in the open Agent Skills format, that an assistant loads when a task matches its description. Claude Code, Claude Desktop, claude.ai and other agents support it. |
| **Skill archive** | The skill folder packed as one zip file, for upload or download. |

## User stories

### US-1 — Get the skill from the app (Priority: P1)

As a user who connects an assistant, I want to get the skill in the same place where I
turn on assistant access.

**Acceptance scenarios**

1. **Given** the dialog "AI assistant access", **When** I choose "Save skill…", **Then**
   a system save dialog opens with a proposed file name that holds the Findy version.
2. **When** I save, **Then** the file is a skill archive that Claude Desktop and claude.ai
   accept for upload, and a notification confirms the save.
3. **Given** no internet connection, **Then** "Save skill…" works the same.
4. **When** I cancel the save dialog, **Then** nothing is written and no message shows.
5. **Given** assistant access is off, **Then** "Save skill…" still works.
6. **When** I choose "How to install", **Then** the README section about the skill opens
   in the system browser.

### US-2 — Get the skill from a release (Priority: P2)

As a user or a contributor, I want to download the skill without the app.

**Acceptance scenarios**

1. **Given** a Findy release, **Then** its assets include the skill archive for that
   version.
2. **Given** the repository, **Then** the skill folder is there as plain files, so a
   person can read it and copy it.

### US-3 — Install the skill (Priority: P1)

As a user, I want clear steps for my assistant.

**Acceptance scenarios**

1. **Given** the README (English and Ukrainian), **Then** a section "Install the Findy
   skill" has steps for:
   - Claude Code (the personal skills folder, and a project folder);
   - Claude Desktop and claude.ai (upload the archive in the settings);
   - other agents that support Agent Skills (their skills folder), and agents that do not
     (add the instructions file as custom instructions).
2. The section says that the skill needs the MCP connection of spec 004 and links to that
   section.

### US-4 — The assistant uses Findy well (Priority: P1)

As a user, I want my assistant to follow the same rules every time.

**Acceptance scenarios**

1. **Given** the skill and the MCP connection, **When** I say "I applied to Acme as a
   frontend developer, here is the link", **Then** the assistant looks for an existing
   application first, then adds one with the link, and tells me what it added.
2. **Given** an application, **When** I say "I had the technical interview at Globex,
   they asked about React", **Then** the assistant moves it to the technical interview
   stage and adds a note with what I said.
3. **When** I ask "How is my job search going?", **Then** the assistant gives the number
   of applications per stage, the ones without movement for a long time, and suggests
   follow-ups.
4. **When** I ask "Prepare me for the Globex interview", **Then** the assistant collects
   the notes, the stage history, the salary and the contact of that application into a
   short brief.
5. **When** I ask to delete an application, **Then** the assistant names it and asks me to
   confirm before it calls the delete tool.
6. **Given** the MCP tools are missing or assistant access is off, **Then** the assistant
   tells me how to connect Findy or turn access on, and does not invent data.

## Functional requirements

### The skill

- **FR-001** Findy MUST have one skill in the open Agent Skills format, named `findy`, in
  English (D-4). Its description MUST say when to use it: tracking a job search, job
  applications, interviews, offers, in Findy.
- **FR-002** The skill MUST describe every MCP tool of the Findy version that ships it:
  what the tool does, its inputs and when to use it. It MUST NOT name a tool that the
  version does not have.
- **FR-003** The skill MUST describe the stages (ids and names), the fields of an
  application (spec 014) and the source as text (spec 014 FR-044).
- **FR-004** The skill MUST describe these workflows (D-5):
  - add an application from the user's words or a vacancy link;
  - update an application after an interview: stage and note;
  - review the job search: counts per stage, applications without movement, follow-ups;
  - prepare for an interview: a brief from one application.
- **FR-005** The skill MUST give these rules:
  - Look for an existing application (by company and title) before adding one; if one
    exists, ask the user.
  - Never invent a job title, a company, a salary or a date. Ask when a required value is
    missing.
  - Before a delete, name the application and get an explicit confirmation.
  - Change a stage only when the user says that it changed.
  - After a change, tell the user in one short sentence what changed.
  - Read only what the task needs; do not copy whole notes into an answer without need.
- **FR-006** The skill MUST tell the assistant what to do when the Findy tools are not
  available or answer that access is off: give the user the connection steps of spec 004
  (turn on access in Findy, copy the configuration from the dialog) and stop (D-6).
- **FR-007** The skill folder MUST be in the repository as plain files.

### Distribution

- **FR-010** The app MUST contain the skill of its own version, so that saving needs no
  network (constitution §II).
- **FR-011** Every release MUST attach the skill archive of that version.
- **FR-012** The archive MUST have the skill folder at its root, as Claude Desktop and
  claude.ai expect for an upload.

### In the app

- **FR-020** The dialog "AI assistant access" MUST have a section "Skill" with a short
  explanation, a "Save skill…" button and a "How to install" link.
- **FR-021** "Save skill…" MUST open the system save dialog with the proposed name
  `findy-skill-<version>.zip` and write the archive to the chosen path. A cancel writes
  nothing. A failed write MUST show as in spec 003. A save MUST show a short confirmation.
- **FR-022** "Save skill…" MUST work whether assistant access is on or off.
- **FR-023** "How to install" MUST open the README section of US-3 in the system browser.
- **FR-024** Both controls MUST work by keyboard and have accessible names.

### Instructions

- **FR-030** README (English) and README.uk (Ukrainian) MUST have the section of US-3,
  next to the MCP section, and the MCP section MUST link to it.

## Non-functional requirements

- **NFR-001** New UI text in English and Ukrainian (constitution §V).
- **NFR-002** No network request for saving the skill (constitution §II).
- **NFR-003** An automated test fails when the skill and the MCP tools differ: a tool
  missing from the skill, or a tool in the skill that the server does not have (FR-002).
- **NFR-004** The skill instructions file stays short enough for an assistant to load
  whole: at most 500 lines.
- **NFR-005** Windows, macOS and Linux: the same archive and the same save flow
  (constitution §IV).

## Edge cases

- The user saves the archive to a folder without write access: the error of spec 003.
- An old skill with a newer Findy: the skill names fewer tools; the assistant still
  works with the tools it knows. The README says to save the skill again after an update.
- A newer skill with an older Findy: the assistant gets an "unknown tool" error from the
  client and tells the user. The README says to use the skill of the same version.
- An agent without skill support: the user adds the instructions file as custom
  instructions (US-3.1).

## Out of scope

- A Claude Code plugin or a marketplace entry.
- A Ukrainian version of the skill text.
- Installing the skill into an assistant automatically.
- New MCP tools, MCP prompts or MCP resources.
- A check from the app that the skill is installed.

## Success criteria

- **SC-001** A user can go from "Save skill…" to a working skill in Claude Desktop in
  under 2 minutes with the README steps.
- **SC-002** With the skill, the assistant asks before every delete and does not add a
  duplicate in the four workflows of FR-004.

## Decisions

- **D-1** Format: one skill in the open Agent Skills format, plus an archive attached to
  every release (owner, 2026-11-21).
- **D-2** Install steps in README en and uk; the MCP dialog links to them (owner).
- **D-3** In the app: "Save skill…" in the MCP dialog; the skill is part of the app, so it
  works offline and matches the version (owner).
- **D-4** The skill text is English only: the assistant reads it, and it answers in the
  user's language anyway (owner).
- **D-5** Workflows: add, update after an interview, review, prepare for an interview
  (owner).
- **D-6** Without the Findy tools, the assistant explains how to connect and does not
  invent data (owner).

## Open questions

None.
