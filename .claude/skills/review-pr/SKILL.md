---
name: review-pr
description: Critically review someone else's pull request to Findy — verify every candidate finding against the source before writing it, check it against the spec and the constitution, then post short inline comments marked by severity and fix effort. Focus is correctness, security, side effects, spec drift and missing tests; style and nitpicks are out of scope. Use when asked to "review this PR", "поревʼю PR", or when handed a PR number from a contributor.
---

# /review-pr — critical review of a contributor's PR

One review pass over a GitHub PR, posted as inline comments. Keep large diffs in a
scratchpad file. Do not dump a full diff into the context.

## Procedure

1. **Resolve the PR and take the diff from GitHub**, never from a local `HEAD`:
   ```bash
   gh pr view <n> --json baseRefName,headRefOid,changedFiles,additions,deletions,body
   gh pr diff <n> > <scratchpad>/pr-<n>.diff
   ```
2. **Check out the head** before you read any local file:
   `gh pr checkout <n>`, then confirm that `git rev-parse HEAD` equals `headRefOid`.
   Stop on a mismatch.
3. **Read the linked spec** (`specs/NNN-*/spec.md`) and the requirements that the PR claims.
   A PR that changes behaviour with no spec, or does not match its spec, is a finding.
4. **Read the production diff before the test diff.** Order:
   `src/main` + `src/preload` → `src/domain` → `src/renderer` → `locales` → tests.
5. **Check the Findy-specific risks:**
   - Security (`docs/security.md`): new `ipcMain.handle` without zod parsing; preload that
     exposes raw `ipcRenderer`; `openExternal` without the http/https check; changed
     `webPreferences` or CSP; `dangerouslySetInnerHTML` with user content.
   - Database (`docs/contracts/database.md`): schema change without a new migration;
     an edited released migration; a mutation outside a transaction; SQL built by string
     concatenation.
   - Renderer imports Electron, Node or `better-sqlite3` (the lint rule must catch it).
   - i18n: a string in only one locale; a hard-coded user-visible string; plurals done
     with `count === 1 ? … : …`.
   - Tests: an acceptance scenario with no test; a test that cannot fail.
   - Cross-platform: path separators, case-sensitive file names, platform-only APIs.
6. **Verify every candidate against the source.** Open the call sites and the files that
   the diff does not show. Most candidates die here. Each survivor has `file:line` evidence.
7. **Drop the nitpicks.** If you cannot state a finding as "this breaks / costs / leaks X",
   it is not a finding.
8. **Draft the comments** into a scratchpad file, show them to the user, and **wait for
   approval**. Posting is visible to other people.
9. **Check each anchor:** the line must be an added or context line in the PR diff.
10. **Post one comment per finding** with `gh api repos/{owner}/{repo}/pulls/<n>/comments`
    (`commit_id` = `headRefOid`, `path`, `line`, `side: RIGHT`, `body`). Build the JSON with
    `python3` from a file, not inline in the shell.
11. **Confirm that the comments landed:**
    `gh api repos/{owner}/{repo}/pulls/<n>/comments -q '.[] | "\(.path):\(.line)"'`.

## Comment contract

- No summary comment. The inline comments are the whole review.
- First line of each comment: severity, then fix effort.
  `🔴 Major` / `🟠 Medium` / `🟡 Optional` · `🏗️ heavy` / `👷 medium` / `⚡ easy`.
- 🔴: ships a bug, a security hole, data loss, spec drift, or a false-green test.
  🟠: a real cost, or a trap for the next change. 🟡: quality, safe to ignore.
- At most one 🟡 while any 🔴 or 🟠 exists.
- About 120 words per comment: claim → evidence (`file:line`) → consequence → fix.
- One comment per defect. Name the other places where it occurs in the same comment.
- If there are more than about eight 🔴 + 🟠, tell the user before you post.
- Write in English. Be kind: many contributors are new to open source.

## Guardrails

- Never post without explicit approval. Approval for one PR is not approval for the next.
- Never post a claim that you did not check in the file.
- Never commit or push to a contributor's branch.
- If the PR is ours, this skill does not apply. Fix and reply on the thread.
