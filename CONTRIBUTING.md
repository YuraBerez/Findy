# Contributing to Findy

Thanks for helping! This guide covers how development works. For what the app
is and how to run it, see [README.md](README.md).

## Spec-driven development

Findy is built spec-first. Before writing code, read:

1. [docs/constitution.md](docs/constitution.md), the project principles
2. [docs/architecture.md](docs/architecture.md), how the app is built
3. [specs/README.md](specs/README.md), the spec → plan → tasks workflow

### I want to fix a bug

Open an issue (or pick one), then send a PR with a test that reproduces the bug.
If the bug is actually a gap in a spec, update the spec in the same PR.

### I want to add a feature

1. Open a **Feature proposal** issue to discuss the idea.
2. Create `specs/NNN-feature-name/spec.md` from `specs/_templates/` and open a PR
   with **only the spec**. It gets reviewed and marked `Approved`.
3. Add `plan.md` and `tasks.md` (and update `docs/` if the architecture changes).
4. Implement in one or more PRs, ticking tasks in `tasks.md`.

### I want to help with translations

All strings live in `locales/en.json` and `locales/uk.json`. Every key must
exist in both files; CI checks this. See [docs/i18n.md](docs/i18n.md).

## Development setup

```bash
npm install
npm run dev
```

Before opening a PR:

```bash
npm run lint
npm test
npm run test:e2e
```

## Branches, commits, PRs

- Branch: `NNN-feature-name` for features, `fix/short-description` for fixes.
- Commits: [Conventional Commits](https://www.conventionalcommits.org/), with
  requirement ids where relevant: `feat(notes): edit note (FR-032)`.
- PR description: link the spec and list the tasks/requirements covered.

## Code of conduct

Be kind and respectful. Harassment of any kind is not tolerated.
