# Tasks: Card colours through the AI assistant

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

## Phase 1 — Data

- [ ] T001 Tests, then `color` in `ApplicationInputSchema` and `ApplicationPatchSchema`, and in
      the store `create` and `update`: set, clear with `null`, keep when missing, reject an
      unknown colour (FR-001, FR-002, FR-004, FR-005)

## Phase 2 — MCP and skill

- [ ] T010 Tests, then the `color` description in `add_application` and `update_application`,
      and `color` in `list_applications` and `get_application` (FR-001…FR-004)
- [ ] T011 `skills/findy/SKILL.md`: the field, the colour ids, a workflow line (FR-007)
- [ ] T012 e2e: an MCP update colours a card on the open board (FR-006)

## Phase 3 — Docs

- [ ] T090 `docs/contracts/ipc.md`, `docs/data-model.md` if it lists the patch, spec 007 note
- [ ] T091 Full gate: format, lint, coverage ≥ 80 %, e2e
