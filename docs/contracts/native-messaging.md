# Contract: browser extension ↔ connector

- **Introduced by:** [specs/019-browser-extension](../../specs/019-browser-extension/spec.md) · **Architecture:** [architecture.md](../architecture.md) D-18

The Findy browser extension talks to Findy only through the native messaging of the
browser. The browser starts the connector (Findy's binary in Node mode with
`out/main/connector.js`) and writes one message to its standard input. The connector
writes one answer to its standard output and exits. There is no network listener.

## Framing

Each message is a 32-bit unsigned length in the byte order of the computer (little-endian
on all supported platforms), then that many bytes of UTF-8 JSON. The connector refuses a
message larger than 64 KB with `PROTOCOL`.

## Host

| Item | Value |
|------|-------|
| Host name | `io.github.findy` (`EXTENSION_HOST` in `src/shared/extension.ts`) |
| Chromium | `allowed_origins`: the Chrome Web Store id only |
| Firefox | `allowed_extensions`: the addons.mozilla.org id only |
| Launcher | `<userData>/connector/findy-connector.sh` or `.cmd` |

## Messages

```ts
type Request =
  | { type: 'hello' }
  | { type: 'lookup'; url: string }                     // http/https, ≤ 2048 chars
  | { type: 'add'; title: string; company: string; url: string };

type Answer =
  | { ok: true; protocol: 1; version: string }          // hello
  | { ok: true; match: { stage: StageId } | null }      // lookup: last updated match (FR-006, FR-007)
  | { ok: true; stage: 'applied' }                      // add: one application in "Applied"
  | { ok: false; error: { code: 'VALIDATION' | 'STORAGE' | 'PROTOCOL'; message: string } };
```

- `add` uses the validation of spec 001 and fills the source from the link (spec 014).
  It runs in one transaction.
- `lookup` compares links with `vacancyLinkKey` (`src/domain/links.ts`, spec 019 FR-007).
- No answer gives other fields, notes or the list of applications (FR-008).
- `protocol` changes only with an incompatible change. The extension shows "Findy not
  found or too old" for any other value (FR-010).
