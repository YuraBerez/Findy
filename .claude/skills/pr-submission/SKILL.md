---
name: pr-submission
description: What to do when you open or finish a pull request in Findy — base branch, quality gate and coverage, the PR body (spec links, requirements, UI section), and the report. Read right before you open a PR (from /deliver-feature or a standalone fix), not at the start of every task.
---

# /pr-submission — opening and finishing a PR

## Base branch and merge

- Base is always `main`. Feature branches: `NNN-name`. Fixes: `fix/<short-description>`.
- Never merge your own PR unless the user tells you to. The user merges with squash.

## Before you push

Run the same checks as CI (`.github/workflows/ci.yml`):

```bash
npm run format:check
npm run lint              # ESLint + tsc for node and web
npm run test:coverage     # fails below 80 % on any metric
npm run test:e2e
```

- Report the coverage numbers that `test:coverage` prints, not numbers that you calculated.
- If coverage fell but stays above 80 %, say so in the PR body with the before/after numbers.
- Do not lower the thresholds in `vitest.config.ts`.

## PR body

Use `.github/pull_request_template.md`. Fill it in completely:

- **Spec:** the link to `specs/NNN-name/spec.md`. A fix without a spec links the issue.
- **Requirements:** the `FR-xxx` / `NFR-xxx` ids that this PR satisfies.
- **Tasks:** the `T0xx` ids ticked in `tasks.md`.
- **`## UI after changes`:** if the diff touches `src/renderer/**`, `locales/**` or the
  native menu, list every changed screen and state in text. Add real screenshots only when
  the user asked for them (see `/pr-ui-screenshots`). With no UI change, write
  `No UI changes.`
- **Database:** if the PR adds a migration, name it, and confirm that a test migrates a
  fixture DB.
- End the body with the attribution line from the session's system instructions.

## After the push

Do not wait for CI in the foreground (no `gh pr checks --watch`, no `sleep`). Report and
stop. Watch CI in a background command if the user asks.

## Done means

The PR is open, CI is green, and every review thread is either fixed (reply with the SHA)
or answered with a reason.

## Report (≤ 120 words)

```text
PR: <url>   CI: <green / pending / red: job>
Coverage: lines X% · branches X% · functions X% · statements X%
E2E: <tests added / run result>
Spec/docs changed: <files, or "none">
Open items for the user: <or "none">
```
