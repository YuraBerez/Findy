# Implementation Plan: Add an application from a link

- **Spec:** [spec.md](spec.md) · **Architecture:** [docs/architecture.md](../../docs/architecture.md)
- **Status:** Approved

## Summary

The page data is read in main and parsed by pure code in `src/domain`. The renderer
only sends the pasted link and gets back a title and a company, or "nothing found".
Main makes one GET with Node's `fetch`, which has no cookie store. It follows redirects
itself, at most 5 and only to `http`/`https`. It stops after 10 s or 2 MB, and decodes
the bytes with the charset of the page. The domain reads job posting data
(schema.org `JobPosting` in JSON-LD), then link preview data (Open Graph), then
`<title>`. It never runs or loads anything from the page. The add dialog gets a
"Fill from link" button and a status line under the link field. A paste of a valid link
starts the same read. No new dependency, no migration.

## Technical context

| Item | Choice |
|------|--------|
| Language | TypeScript (strict) |
| HTML | Own extraction in `domain/vacancy/` (JSON-LD blocks, `<meta>` tags, `<title>`, entities) with regular expressions: no DOM, no HTML parser library |
| Network | Node's `fetch` in main (no cookie store) with `redirect: 'manual'` and `credentials: 'omit'`; injected, so unit tests use fakes |
| Charset | `TextDecoder` with the charset from `Content-Type` or `<meta charset>`; UTF-8 when unknown |
| Storage | None |
| Testing | Vitest (extraction, decoding, fetch rules with fake responses, IPC); e2e with a local HTTP server of test pages |
| Target platforms | Windows, macOS, Linux |

## Constitution check

| Principle | Complies? | Notes |
|-----------|-----------|-------|
| I. Spec first | ✅ | Spec 009, approved 2026-11-19 |
| II. Local-first | ✅ after §II.7 | New exception §II.7 (spec D-1), in a separate PR with the `constitution` label, merged before this feature. Only on a user action; one GET to the pasted link; no user data; offline → the dialog works as before (§II.3) |
| III. Secure Electron | ✅ | Request in main only; renderer CSP unchanged; URL parsed with zod (`http`/`https`); no cookies or stored login; redirects checked one by one; size and time limits; HTML is only searched as text, never rendered or run |
| IV. Cross-platform | ✅ | Electron session API and `TextDecoder` on all three |
| V. i18n | ✅ | Button, status and message in en + uk; page values are not translated |
| VI. Tested | ✅ | Unit: every FR-004 source, entities, cut to 200, charsets, redirect and limit rules, IPC; e2e: every acceptance scenario against local pages (NFR-004) |
| VII. Simplicity | ✅ | No HTML parser and no scraping library; generic rules only (spec D-4, plan D-5) |
| VIII. Accessible | ✅ | Button reachable by Tab; status in a live region; message linked to the link field |

## Requirement → component map

| Requirements | Where |
|--------------|-------|
| FR-004 | `domain/vacancy/`: `extractVacancy(html, url)` takes each field from the first source that has it: `structured.ts` (JSON-LD `JobPosting` in `@graph` and arrays, then microdata `itemprop`), `title.ts` (`og:title`, else `<title>`, split at ` — `, ` - `, ` \| `, ` · `, ` :: ` or "at", without parts equal to `og:site_name` or the host), `visible.ts` (first `<h1>`; first element whose class, id, `itemprop`, `data-testid` or `data-qa` says company / employer / компанія / роботодавець, ≤ 100 characters; scripts, styles, templates and comments removed), then `og:site_name`; `text.ts`: entities, whitespace, cut to 200 |
| Edge cases (charset) | `domain/vacancy/charset.ts`: `charsetOf(contentType, head)` from the header or `<meta charset>` / `http-equiv` in the first 1 024 bytes |
| NFR-001, NFR-002, FR-006 | `main/vacancy.ts`: `readVacancyPage(fetchFn, url)`: manual redirects (≤ 5, `http`/`https` only), `text/html` or `application/xhtml+xml` only, 10 s timeout, stream read stopped at 2 MB, decode; every failure → `null` |
| FR-001, FR-002 (contract) | IPC `readVacancy(url)` → `{ title, company } \| null`; zod `HttpUrlSchema`; never rejects for a network failure (FR-006 is not an error notification) |
| FR-003, FR-007 | `useApplicationForm.fillEmpty(values)` (fills only fields that are empty now); `features/applications/useVacancyFill`: request id, ignores old answers and answers after unmount |
| FR-001, FR-002, FR-005, FR-006, FR-009 | `ApplicationDialog`: link field `onPaste`, "Fill from link" `Button`, status line (`role="status"`), message linked by `aria-describedby`; `ApplicationFields` gets an optional slot under the link field, so the details panel does not change |
| FR-008 | Nothing saves: the dialog only fills its form |
| NFR-004 | `e2e/data/vacancy-server.ts`: local server with test pages (JSON-LD, Open Graph only, no data, slow, large, redirect, PDF) |

## IPC contract change

```ts
readVacancy(url: string): Promise<{ title: string | null; company: string | null } | null>;
// null: the page could not be read or has neither value (FR-006). VALIDATION for a
// link that is not http/https. Spec 009.
```

## Key decisions

### D-1 — Read in main, parse in the domain

- **Options considered:** fetch in the renderer (CSP `connect-src` to any site); a
  hidden `BrowserWindow` that loads the page (runs its scripts); a GET in main.
- **Chosen:** a GET in main, text extraction in `src/domain`.
- **Why:** the renderer CSP stays `connect-src 'self'` (§III). A hidden window would run
  the page's code, and the spec does not allow that (NFR-001). Pure extraction is fully
  unit-testable.

### D-2 — Node's `fetch`, manual redirects

- **Options considered:** Electron `net.fetch` or a session `fetch` (in-memory
  partition); Electron `net.request` with a `redirect` event; Node's `fetch`.
- **Chosen:** Node's `fetch` in main, `redirect: 'manual'`, `credentials: 'omit'`.
  Main checks each `Location`.
- **Why:** NFR-001: no cookies or stored login (Node's `fetch` has no cookie store),
  and no redirect to `file:` or other schemes. Electron's `fetch` throws "Redirect was
  cancelled" with `redirect: 'manual'` (checked on Electron 45), so it cannot check
  each redirect. Trade-off: Node's `fetch` does not use the system proxy and
  certificate settings; behind such a proxy a read fails and FR-006 applies.

### D-3 — Regular expressions, not an HTML parser

- **Why:** we need three kinds of data (JSON-LD blocks, a few `<meta>` tags, `<title>`),
  not a DOM. A parser library adds size for no gain (§VII). Attribute order and quotes
  vary: the tests cover them.

### D-4 — `null` instead of an error

- **Why:** FR-006 says the message is not an error notification (spec 003), so
  `readVacancy` resolves with `null` for every network or page problem. It goes through
  `useAppState.run()` like every IPC call, and only a real bug (VALIDATION) shows a
  notification.

### D-5 — Generic rules in a fixed order, no site adapters

- **Why:** spec D-4. A rule that knows the meaning of a source (job posting data) comes
  before a guess (a heading, a class name). Each field takes the first source that has
  it, so one weak source does not override a good one. A local model is not part of
  this plan (spec D-6).

## Risks

- **A site blocks requests without a browser User-Agent** → send a common desktop
  User-Agent and `Accept: text/html`. Some sites still block (Cloudflare checks), and
  then FR-006 applies.
- **LinkedIn and others need a login** → FR-006; out of scope (spec D-4).
- **A guess is wrong** (a login page's heading "Sign in", a job board name as the
  company) → the values are only suggestions in the form; the user checks them before
  "Save" (FR-008).
- **Large pages with JSON-LD at the end** → the 2 MB limit is above common job pages
  (≈ 100–500 KB).
