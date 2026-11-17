---
name: learn
description: End-of-task distillation gate for Findy — capture durable lessons, corrections and decisions from a finished task into the right place (personal memory, docs/, a spec, CLAUDE.md, or a skill) under a strict anti-bloat rule. The default action is DISCARD. Use after a substantive task, when the user corrected you, or when asked to "remember this" / "запамʼятай". Skip for trivial edits, Q&A and read-only exploration.
---

# /learn — distillation gate

Turn the finished task into durable knowledge **without bloat**.

## Procedure

1. **Decide if there is anything to learn.** Was the task substantive: a feature, a
   non-trivial fix, a decision, a debugging session, a user correction, a gate failure that
   you had to work around? If not, say "nothing durable" and stop. **The default is DISCARD.**

2. **Scan the session for signal:**
   - a user correction or a stated preference;
   - an approach that the user confirmed;
   - a lint, type, coverage or e2e failure that you had to fix, and its cause;
   - a decision that is hard to reverse, surprising, and a real trade-off;
   - a multi-step procedure that will repeat;
   - a platform gotcha (Windows / macOS / Linux, Electron, SQLite, CI runners).

3. **Keep test.** Keep a candidate only if (a) it helps a future session **and** (b) it is
   not derivable from the code, the git history, `specs/` or `docs/`.

4. **Dedup.** Search for an existing entry first. If one exists, update it.

5. **Route to the right place:**

   | Candidate | Place | Tier |
   |---|---|---|
   | Personal preference of the user, "remember this" | personal memory `~/.claude/projects/*/memory/` (`type: feedback` / `user`, with **Why** and **How to apply**) | auto-write |
   | Architecture decision + rationale | new `D-N` entry in `docs/architecture.md` | propose → wait |
   | Change to a contract or the data model | `docs/contracts/*` / `docs/data-model.md`, with the spec that needs it | propose → wait |
   | Behaviour gap in a feature | the feature's `spec.md` (new requirement or decision) | propose → wait |
   | A rule that every agent must follow | one line in `CLAUDE.md` → *Code rules* | propose → wait |
   | Reusable procedure | new `.claude/skills/<name>/SKILL.md` | propose → wait |
   | Platform or CI gotcha | `docs/release.md` or a short section in the relevant doc | propose → wait |

   **Auto-write:** write at once, then add the pointer line to `MEMORY.md`.
   **Propose:** show the exact diff to the user and wait for approval.

6. **Report** each item that you wrote (path) and each item that you discarded (reason),
   one line each.

## Hard rules

- `CLAUDE.md` stays short: rules and pointers, no stories or rationale.
- One fact per memory file.
- Never change `docs/constitution.md` from this skill. A constitution change needs its
  own PR (see the constitution header).
- If it is derivable from code or git, discard it.
