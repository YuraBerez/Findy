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

Requirements: [Node.js](https://nodejs.org/) 22 LTS or newer, npm, Git.

```bash
git clone https://github.com/YuraBerez/findy.git
cd findy
npm install
npm run dev          # start the app with hot reload
```

| Command | What it does |
|---------|--------------|
| `npm run build` | Production build of the app code |
| `npm run dist` | Build an installer for your current OS into `dist/` |
| `npm test` | Unit tests |
| `npm run test:coverage` | Unit tests with the 80 % coverage gate |
| `npm run test:e2e` | End-to-end tests against the real app |
| `npm run lint` | Lint and type-check |

On Linux you may need the usual Electron system libraries
(`libgtk-3-0 libnss3 libasound2`); for building `.deb` packages also `fakeroot` and `dpkg`.

Before opening a PR:

```bash
npm run lint
npm run test:coverage   # fails below 80 % coverage
npm run test:e2e
```

### README screenshots

If a PR changes how the board or the details panel look, regenerate the README
screenshots (macOS or Linux; demo data, light theme, en and uk):

```bash
npm run screenshots   # writes docs/screenshots/*.png
```

## Branches, commits, PRs

- Branch: `NNN-feature-name` for features, `fix/short-description` for fixes.
- Commits: [Conventional Commits](https://www.conventionalcommits.org/), with
  requirement ids where relevant: `feat(notes): edit note (FR-032)`.
- PR description: link the spec and list the tasks/requirements covered.

## Code of conduct

Be kind and respectful. Harassment of any kind is not tolerated.
