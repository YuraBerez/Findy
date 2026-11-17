# Tasks: MCP server

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

- [ ] T001 Hidden-stage rule into `Repository` (shared by IPC and MCP); `mcpEnabled` setting; unit tests (FR-003, FR-005)
- [ ] T002 `mcp/tools.ts`: 8 tools with zod schemas, annotations, gate; unit tests (FR-002, FR-004, FR-008)
- [ ] T003 `mcp/server.ts` + `--mcp` headless mode in `main/index.ts`; stdout clean (FR-001)
- [ ] T004 `watch.ts` (data_version) + `findy:stateChanged` → renderer reload (FR-006)
- [ ] T005 IPC `setMcpEnabled`, `getMcpConnection`; app menu → AI assistant access dialog (FR-005, FR-009)
- [ ] T006 en/uk strings; README setup section; docs (architecture, ipc, data model)
- [ ] T007 e2e: real MCP client (SDK) against `--mcp`: gate, add/move/note/delete, validation, open app updates (US-1…US-5); a11y of the dialog
