# Tasks: MCP server

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

- [x] T001 Hidden-stage rule into `Repository` (shared by IPC and MCP); `mcpEnabled` setting; unit tests (FR-003, FR-005)
- [x] T002 `mcp/tools.ts`: 8 tools with zod schemas, annotations, gate; unit tests (FR-002, FR-004, FR-008)
- [x] T003 `mcp/server.ts` + `--mcp` headless mode in `main/index.ts`; stdout clean (FR-001)
- [x] T004 `watch.ts` (data_version) + `findy:stateChanged` → renderer reload (FR-006)
- [x] T005 IPC `setMcpEnabled`, `getMcpConnection`; app menu → AI assistant access dialog (FR-005, FR-009)
- [x] T006 en/uk strings; README setup section; docs (architecture, ipc, data model)
- [x] T007 e2e: real MCP client (SDK) against `--mcp`: gate, add/move/note/delete, validation, open app updates (US-1…US-5); a11y of the dialog
