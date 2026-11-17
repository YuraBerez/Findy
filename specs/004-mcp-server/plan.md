# Implementation Plan: MCP server

- **Spec:** [spec.md](spec.md) · **Architecture:** [docs/architecture.md](../../docs/architecture.md)
- **Status:** Approved

## Summary

Update (CI on Windows): the server runs Findy's binary in Node mode
(`ELECTRON_RUN_AS_NODE=1` + `out/main/mcp.js`); `Findy --mcp` forwards to it. See
architecture D-8. The original design below started the Electron main process:

`Findy --mcp` starts the same Electron binary in a headless mode: no window, no
Dock icon, no single-instance lock. It opens the same database with the same
`Repository` and serves MCP tools over stdio with `@modelcontextprotocol/sdk`.
The open app notices commits of the MCP process through `PRAGMA data_version`
and tells the renderer to reload the state.

## Architecture

```
Claude (MCP client) ──stdio──▶ Findy --mcp ──▶ mcp/tools.ts ──▶ Repository ──▶ findy.db
                                                     ▲ same zod schemas         ▲ WAL
Findy (window) ──IPC──▶ ipc.ts ─────────────────────▶ Repository ───────────────┘
      ▲ findy:stateChanged ◀── db watcher (data_version, 1 s)
```

- **One rule set (FR-003):** the hidden-stage rule moves from `ipc.ts` into
  `Repository` (`HiddenStageError`), so IPC and MCP share it. Both adapters parse
  input with the zod schemas in `domain/schema.ts`.
- **Gate (FR-005):** settings row `mcpEnabled` (default off). Every tool checks it.
- **Tools (FR-002, FR-004, FR-008)** in `src/main/mcp/tools.ts`: pure definitions
  (name, schema, annotations, run) over a `Repository`; `server.ts` only registers
  them with the SDK and maps errors to MCP tool errors. Unit-tested without the SDK.
- **stdout is the protocol:** in MCP mode `console.log` goes to stderr.
- **Change detection (FR-006):** `main/watch.ts` compares `data_version` once a
  second; on a change main sends `findy:stateChanged`, `useAppState` reloads.
- **Connect dialog (FR-009):** IPC `getMcpConnection()` returns the command
  (`process.execPath`, plus the app path in development) and `--mcp`; the
  renderer shows ready-to-copy snippets for Claude Desktop/Cowork and Claude Code.

## Constitution check

| Principle | Complies? | Notes |
|-----------|-----------|-------|
| I. Spec first | ✅ | Spec 004 approved |
| II. Local-first | ✅ | §II.5 (amended): stdio only, off by default |
| III. Secure Electron | ✅ | No window in MCP mode; inputs parsed with zod |
| IV. Cross-platform | ✅ | Same binary on all OSes |
| V. i18n | ✅ | Dialog strings in en/uk; tool texts in English (for the model) |
| VI. Tested | ✅ | Unit: tools, gate, watcher; e2e: real MCP client against `--mcp` |
| VII. Simplicity | ✅ | One new dependency (`@modelcontextprotocol/sdk`, MIT) |
| VIII. Accessible | ✅ | Dialog with a switch and copy buttons; axe audit |

## Decisions

- **D-1** Headless Electron mode instead of `ELECTRON_RUN_AS_NODE`: the client
  config stays one command, and `app.getPath('userData')` is the same as the app's.
