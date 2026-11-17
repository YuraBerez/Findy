# Feature Spec: MCP server — manage the board from Claude

- **ID:** 004-mcp-server
- **Status:** Approved
- **Created:** 2026-11-17
- **Approved:** 2026-11-17 (owner)
- **Builds on:** [001-mvp-board](../001-mvp-board/spec.md), [002-hidden-columns](../002-hidden-columns/spec.md)

## Summary

Users already talk to an AI assistant about their job search ("I just applied to
Acme for the frontend role", "move Globex to the technical interview and note the
date"). Findy can expose its board to such assistants through the Model Context
Protocol (MCP), so that Claude Desktop, Claude Cowork or Claude Code can read and
change applications on the user's request. The same rules as in the app apply,
the open app shows the changes at once, and access is off until the user turns it on.

## Glossary

| Term | Meaning |
|------|---------|
| **MCP client** | An AI app that calls MCP tools: Claude Desktop, Cowork, Claude Code. |
| **MCP server** | Findy's binary in Node mode with `mcp.js` (or `Findy --mcp`); talks to one client over stdio. |
| **Tool** | One action the client can call, e.g. `add_application`. |

## User stories

### US-1 — Turn assistant access on and off (P1)

As a user, I want to decide whether an AI assistant may access my board.

**Acceptance scenarios**

1. **Given** a new installation, **Then** assistant access is off.
2. **Given** access is off, **When** an MCP client calls any tool, **Then** the tool
   fails with a message that says how to turn access on in Findy.
3. **Given** the app menu, **When** I turn on "AI assistant access (MCP)", **Then**
   the app shows how to connect a client (the command to add), and tools work.
4. **When** I turn it off again, **Then** the next tool call fails as in 1.2.

### US-2 — Add and update applications from a chat (P1)

As a user, I want to tell Claude about a new application or an update, so that I do
not have to copy it into the board by hand.

**Acceptance scenarios**

1. **Given** access is on, **When** Claude calls `add_application` with a title,
   company and optional link and stage, **Then** the application is created as in
   001 US-1 (same validation), and the tool returns it.
2. **When** Claude calls `move_application` to a stage, **Then** the stage changes
   and the history records it (001 FR-024).
3. **When** Claude calls `update_application` or `add_note`, **Then** the change is saved.
4. **Given** invalid input (empty title, a non-http(s) link, a hidden stage), **Then**
   the tool fails with a message that explains which field is wrong.

### US-3 — Ask about the job search (P1)

**Acceptance scenarios**

1. **When** Claude calls `list_applications` (optionally by stage or a search text),
   **Then** it gets the applications with stage, company, link, dates and note count.
2. **When** Claude calls `get_application`, **Then** it gets the full application with
   notes and stage history.

### US-4 — The open app shows changes at once (P1)

**Acceptance scenarios**

1. **Given** Findy is open, **When** an MCP tool changes data, **Then** the board
   shows the change within 2 seconds, without a reload.

### US-5 — Delete with care (P2)

**Acceptance scenarios**

1. **When** Claude calls `delete_application`, **Then** the tool is marked
   destructive, so the client asks the user before the call, and the application is
   deleted with its notes.
2. "Reset board" and settings are not available through MCP.

## Functional requirements

- **FR-001** Findy's binary MUST start an MCP server over stdio only, with no network
  listener and no window: in Node mode (`ELECTRON_RUN_AS_NODE=1` + the bundled
  `mcp.js`), or with `Findy --mcp`, which forwards to it. It MUST exit by itself when the client closes the connection
  (end of stdin), so no Findy process stays behind after the assistant quits.
- **FR-002** Tools: `list_applications`, `get_application`, `list_stages`,
  `add_application`, `update_application`, `move_application`, `add_note`,
  `delete_application`. No other data access.
- **FR-003** Every tool MUST use the same validation and repository as the app
  (zod schemas, hidden-stage rule, limits); no second set of rules.
- **FR-004** Tools MUST carry MCP annotations: read-only tools `readOnlyHint`,
  `delete_application` `destructiveHint`.
- **FR-005** A setting "AI assistant access (MCP)", off by default, MUST gate every
  tool. It is stored in the database like other settings.
- **FR-006** The app MUST notice changes made by another process (the MCP server)
  and refresh the board within 2 s.
- **FR-007** Concurrent use MUST be safe: SQLite WAL with a busy timeout; every tool
  call is one transaction.
- **FR-008** Tool results MUST be JSON objects with stable field names; errors MUST
  be MCP tool errors with a human-readable message.
- **FR-009** The app MUST show how to connect: the command line for the current
  platform, ready to copy, in the dialog that turns access on.
- **FR-010** README MUST explain setup for Claude Desktop/Cowork and Claude Code,
  and that data reaches the AI provider only when the user asks the assistant.

## Non-functional requirements

- **NFR-001** No network access by Findy itself (constitution §II). Sending data to
  the AI provider is done by the MCP client, at the user's request.
- **NFR-002** A tool call returns in under 200 ms with 1 000 applications.

## Edge cases

- The database is damaged or from a newer version: tools fail with the storage
  message; the server does not modify the file (001 FR-054).
- The app is not running: the MCP server works alone; the app shows the changes on
  its next start.
- Two clients at once: each gets its own server process; SQLite serialises writes.
- Ambiguous title in `get_application`: tools take ids; `list_applications` gives them.

## Out of scope

- A CLI (may reuse the same core later).
- Remote/HTTP transport, accounts, sharing between devices.
- Reset board and settings through MCP.
- A one-click `.mcpb` extension (follow-up).

## Decisions

- **D-1** Delivered inside the app (`--mcp`), not as an npm package: no Node.js needed.
- **D-2** Off by default; turned on in the app (owner decision, 2026-11-17).
- **D-3** Tools: read, add, update, move, notes, delete (owner decision, 2026-11-17).
- **D-4** Constitution §II gets an amendment: "User-initiated sharing through a local
  MCP client is allowed; it is off by default." Separate PR with the `constitution` label.

## Open questions

- None.
