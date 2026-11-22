# Project docs

**User guides** (English and Ukrainian):

| Guide | What's inside |
|-------|---------------|
| [guide/install.md](guide/install.md) | Homebrew, Scoop, check a download, the first start |
| [guide/ai-assistant.md](guide/ai-assistant.md) | Connect an AI assistant (MCP), install the Findy skill |
| [guide/browser-extension.md](guide/browser-extension.md) | Install the browser extension and add vacancies from the browser |

**For contributors:** cross-cutting, long-lived knowledge about how Findy is built. Feature specs
live separately in [`/specs`](../specs/README.md).

| Doc | What's inside |
|-----|---------------|
| [constitution.md](constitution.md) | Non-negotiable principles (read first) |
| [architecture.md](architecture.md) | Stack, process model, project structure, key decisions |
| [data-model.md](data-model.md) | Entities, fields, invariants |
| [contracts/ipc.md](contracts/ipc.md) | Renderer ↔ main API |
| [contracts/database.md](contracts/database.md) | Local SQLite database: schema, transactions, migrations |
| [i18n.md](i18n.md) | Localisation rules (en / uk) |
| [security.md](security.md) | Electron hardening checklist |
| [release.md](release.md) | Build targets, CI, release process |
| [brand.md](brand.md) | Logo, colours, icon files |

**docs vs specs:** a spec says *what* a feature must do and is frozen once
implemented. Docs describe *the system as it is now* and evolve; every change
to docs is driven by a spec and lands in the same PR.
