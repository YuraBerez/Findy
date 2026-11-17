---
name: refine-requirements
description: Spec-first refinement for Findy — turn a raw or vague feature idea into a Draft spec in `specs/NNN-name/spec.md` with every ambiguity resolved with the user, before any plan or code. Use when the user asks for a new feature or a non-trivial behaviour change that has no approved spec yet, or says "specify", "опиши фічу", "напиши специфікацію". Output is a spec (and optionally a GitHub issue), never code.
---

# /refine-requirements — raw idea → approved spec

Step 1 of the SDD workflow in `specs/README.md`. The output is a spec that a later
`/deliver-feature` run can implement without guessing.

**In:** a requirement in any form (a chat message, an issue, one sentence).
**Out:** `specs/NNN-name/spec.md` with `Status: Draft`, no open `[NEEDS CLARIFICATION]`,
added to the index in `specs/README.md`. The user then approves it.

## Procedure

### 1. Gather context (no questions yet)

- Read `docs/constitution.md`. A requirement that breaks a principle is a blocking question.
- Read the specs index in `specs/README.md`. If an existing spec covers the area, read it.
  Extend it with a new spec that references it. Do not edit an `Implemented` spec.
- Read the `docs/` files that the requirement touches: `data-model.md`,
  `contracts/ipc.md`, `contracts/database.md`, `i18n.md`.
- Search open issues for duplicates: `gh issue list --search "<words>"`.

### 2. Find the ambiguity — do not guess

List every point that changes scope, data model, IPC contract, or UX, and that no spec or
doc settles. Typical questions for Findy:

- Which stages, fields or screens does it touch? Does it change the database schema?
- Behaviour for edge cases: empty board, 1 000 cards, very long text, offline, corrupt DB.
- Both locales: new strings, plurals, date formats.
- Keyboard access for every new action (constitution §VIII).
- What is explicitly out of scope for this spec?

Ask with `AskUserQuestion`, batched, with a recommended default first. Cite the doc
instead of asking when a doc already answers. If the request is a small, unambiguous bug
fix, skip the spec: say so and route it to a normal fix PR.

### 3. Write the spec

- Next free number: the highest `NNN` in `specs/` + 1. Numbers are never reused.
- Copy `specs/_templates/spec-template.md` to `specs/NNN-short-name/spec.md`.
- Write user stories with priorities and Given/When/Then acceptance scenarios.
- Number requirements: `FR-001`… and `NFR-001`… Each must be testable.
- No implementation details: no libraries, file names or APIs. Those go in `plan.md`.
- Put the user's answers in a `## Decisions` section (D-1, D-2…).
- Add the row to the index in `specs/README.md` with status `Draft`.

### 4. Hand off

- Show the user the spec path and a 3–5 line summary. Ask for approval.
- After approval: set `Status: Approved` and the date in the spec and the index.
- Optional, only if the user asks: open an issue from
  `.github/ISSUE_TEMPLATE/feature_proposal.md` that links the spec.
- Implementation continues with `/deliver-feature`. This skill writes no code.

## Hard rules

- Never write a requirement that you still guess about. Ask first.
- Never put code, library names or file paths in `spec.md`.
- Never start `plan.md` or code before the spec is `Approved`.
