# Security policy

## Supported versions

Only the latest release gets security fixes while Findy is below 1.0.

## Reporting a vulnerability

Please do **not** open a public issue. Report it privately through GitHub:
**Security → Report a vulnerability** on
[github.com/YuraBerez/findy](https://github.com/YuraBerez/findy/security/advisories/new).

Include what you found, how to reproduce it, and the version and OS. You get an
answer within 7 days. When a fix is released, the advisory is published with
credit to you, if you want it.

## Scope

Of special interest: the IPC boundary between the window and the main process,
opening external links, the local database, and the MCP server (`Findy --mcp`,
spec 004). See [docs/security.md](docs/security.md) for the design.
