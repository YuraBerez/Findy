---
name: deliver-feature
description: Implement an approved Findy spec end to end — plan.md and tasks.md (if missing), a feature branch, task-by-task implementation with tests, the local quality gate (lint + coverage ≥ 80 % + e2e), one PR, review fixes. Use when the user says "implement spec NNN", "реалізуй фічу", "take tasks into work", or hands over an approved spec. Not for raw ideas (run /refine-requirements first) and not for one-line fixes.
---

# /deliver-feature — approved spec → merged PR

Steps 2–5 of the SDD workflow in `specs/README.md`.

**In:** `specs/NNN-name/spec.md` with `Status: Approved`.
**Out:** one PR from `NNN-name` into `main` with all tasks ticked, green CI, and specs/docs in
sync with the code.

## 0. Preconditions

- The spec status is `Approved`. If it is `Draft`, stop and ask the user to approve it.
- The working tree is clean. `git status` shows no changes that are not yours.

## 1. Plan (if `plan.md` is missing)

1. Read the spec, `docs/constitution.md`, `docs/architecture.md` and every `docs/` file
   that the spec touches.
2. Write `plan.md` from `specs/_templates/plan-template.md`:
   - the constitution check table, with every row filled;
   - a requirement → component map (`FR-xxx` → files/modules);
   - risks and mitigations.
3. If the feature changes the architecture, update `docs/` in the same branch:
   - new or changed IPC calls → `docs/contracts/ipc.md`;
   - schema change → `docs/contracts/database.md` + `docs/data-model.md` (new migration);
   - new decision → a `D-N` entry in `docs/architecture.md`.
4. Write `tasks.md` from the template. Each task references its `FR-xxx`. Mark parallel
   tasks with `[P]`. Put the tests for a task in the same task or the task before it.
5. Show the plan summary to the user. Continue only after the user agrees.

## 2. Branch

```bash
git switch main && git pull --ff-only
git switch -c NNN-name
```

Commit `plan.md` + `tasks.md` (+ docs) as the first commit:
`docs(NNN): plan and tasks`.

## 3. Implement — one task at a time

For each task in order:

1. Write or extend the unit tests first for `src/domain`, `src/main` or `src/shared`.
   Add or extend an e2e spec in `e2e/specs/` for each acceptance scenario. Follow the
   playwright-e2e-kit layers: specs → steps → screens; seed data through `findy.api`.
2. Write the code. Follow `CLAUDE.md` → *Code rules*.
3. New UI strings go into **both** `locales/en.json` and `locales/uk.json`
   (see `/localization`).
4. Run the gate for the task:
   ```bash
   npm run lint && npm run test:coverage
   ```
5. Tick the task (`- [x]`) in `tasks.md` in the same commit.
6. Commit: `feat(<area>): <what> (FR-0xx)`. One task, or a few small related tasks, per commit.

If the code must differ from the spec, stop and tell the user. After agreement, update
`spec.md` in the same branch. Never let the code and the spec drift.

**Parallel parts (optional).** Use subagents only when a phase has more than three `[P]`
tasks with disjoint files. Give each subagent its own worktree
(`git worktree add ../findy-<task> -b part/<task> NNN-name`), the task ids, and the list of
files that it owns. Merge each part into `NNN-name` yourself, then re-run the full gate.
Verify each part from `git log` and the gate output, not from the agent's report.

## 4. Full gate before the PR

```bash
npm run format:check
npm run lint
npm run test:coverage   # ≥ 80 % lines/branches/functions/statements
npm run test:e2e
```

All four must pass. If coverage is below 80 %, add tests. Do not lower the thresholds in
`vitest.config.ts`: that needs a constitution change.

## 5. PR

Read `/pr-submission` and open the PR as it says.

## 6. Review → fix loop

- Wait for CI with a background command, not with `sleep`.
- Fix every review comment in a new commit on the same branch. Reply on the thread with
  the fix SHA, or with the reason if you do not fix it.
- At most 3 review rounds. If threads stay open after that, stop and report to the user.

## 7. After merge

- When all P1 and P2 stories of the spec are in `main`, set the spec status to
  `Implemented` in `spec.md` and in `specs/README.md`.
- Run `/learn` once. The usual result is "nothing durable".
- Report: PR link, tasks done, coverage numbers, e2e tests added, anything deferred.

## Hard rules

- Never merge into `main` yourself unless the user tells you to.
- Never merge with red CI or an open review thread.
- Never force-push a shared branch.
- Never skip the tests for a task to "come back later".
