# Implementation Plan: Share analytics as an image

- **Spec:** [spec.md](spec.md) · **Architecture:** [docs/architecture.md](../../docs/architecture.md)
- **Status:** Approved

## Summary

The renderer draws the card on a 1080 × 1080 `<canvas>` with the 2D API, from the same
`analytics()` data as the screen, and encodes it as PNG. The preview shows the PNG. "Copy"
and "Save as PNG" send the PNG bytes to main through two new IPC calls: main puts the image
on the system clipboard, or writes it to the path of the system save dialog. No new
dependency, no network, no schema change.

## Technical context

| Item | Choice |
|------|--------|
| Language | TypeScript strict |
| Frameworks | React (renderer), Electron `clipboard`, `nativeImage`, `dialog` (main) |
| Storage | None: the image is not stored; the user picks the file path |
| Testing | Vitest: main saver, IPC validation, card content, text fit, light palette; Playwright e2e for the stories |
| Target platforms | Windows, macOS, Linux |

## Constitution check

| Principle | Complies? | Notes |
|-----------|-----------|-------|
| I. Spec first | Yes | Spec 023 approved 2026-11-28 |
| II. Local-first | Yes | Drawn on the computer; no request; the user decides where the image goes (NFR-004) |
| III. Secure Electron | Yes | Two new IPC calls, zod-validated: a PNG of at most 5 MB with the PNG signature. Main writes only the path from the save dialog; the renderer never sees a path. CSP does not change: the preview is a `data:` image, the logo is a bundled asset |
| IV. Cross-platform | Yes | Electron `clipboard.writeImage` works on all three; e2e reads the image back from the clipboard |
| V. i18n | Yes | All card text from `locales/*.json`; numbers and percentages with `Intl` in the active language |
| VI. Tested | Yes | Unit tests for main and the pure renderer modules; e2e for each acceptance scenario |
| VII. Simplicity | Yes | Canvas 2D, no image or chart library; one main module like `main/calendar.ts` |
| VIII. Accessible | Yes | A normal `@ui` button; `@ui/Dialog` traps focus and returns it; the preview has a text alternative with every number (WCAG 1.1.1) |

## Requirement → component

| Requirement | Component |
|-------------|-----------|
| FR-001…FR-003 | `features/analytics/Analytics` (header row), `ui/icons#ImageIcon` |
| FR-010…FR-016, FR-025 | `features/analytics/shareImage/`: `content.ts` (texts and numbers), `draw.ts` (canvas, text fit), `palette.ts` (light colours) |
| FR-020, FR-024 | `features/analytics/ShareImageDialog` on `@ui/Dialog` |
| FR-021…FR-023 | `shared/ipc.ts` (`copyImage`, `saveImage`), `main/image.ts#createImageSharer`, `main/ipc.ts`, `main/app/services.ts`, `app/useAppState.ts`, notifications (spec 003) |
| NFR-001 | `locales/en.json`, `locales/uk.json` (`analytics.share.*`) |
| NFR-002 | `palette.ts` contrast test; e2e axe audit of the preview |
| NFR-005 | e2e reads the clipboard image in main |

## Architecture

```
Analytics ──click──▶ buildShareCard(data, t, language)   (content.ts, pure)
                          │
                          ▼
                     drawShareCard(canvas, card, logo)   (draw.ts, canvas 2D)
                          │ canvas.toDataURL('image/png')
                          ▼
              ShareImageDialog  <img src=data:…>  + text alternative
                 │ Copy                     │ Save as PNG
                 ▼                          ▼
   actions.copyImage(bytes)        actions.saveImage(bytes)      (useAppState.attempt)
                 │ findy:copyImage          │ findy:saveImage
                 ▼                          ▼
   main: zod PngSchema → clipboard.writeImage / save dialog + writeFile
```

## Project structure

```
src/
├── shared/ipc.ts                         # + copyImage, saveImage
├── domain/schema.ts                      # + PngSchema (size and signature)
├── main/image.ts                         # createImageSharer: copy, save, file name
├── main/ipc.ts, main/app/services.ts     # handlers and Electron wiring
├── preload/index.ts                      # (generic: channel list from shared/ipc.ts)
└── renderer/
    ├── app/useAppState.ts, app/App/App.tsx
    ├── ui/icons/icons.tsx                # + ImageIcon
    └── features/analytics/
        ├── Analytics/                    # button in the filter row, opens the dialog
        ├── ShareImageDialog/             # preview, Copy, Save as PNG, Close
        └── shareImage/                   # content.ts, draw.ts, palette.ts, index.ts
tests/unit/
├── image.test.ts                         # main saver
├── ipc.test.ts                           # + validation of the two calls
└── renderer/share-image.test.ts          # content, text fit, palette = global.css light
e2e/
├── screens/share-image.screen.ts
└── specs/share-image.spec.ts
```

## Key decisions

### D-1 — Draw on a canvas in the renderer

- **Options considered:** `webContents.capturePage` of a hidden window with an HTML card;
  an HTML-to-image library; canvas 2D in the renderer.
- **Chosen:** canvas 2D.
- **Why:** no extra window, no dependency (§VII), exact pixel size, and the same
  `analytics()` data and translations that the screen has. The layout is simple: text,
  rounded rectangles and bars.

### D-2 — Main does the clipboard and the file

- **Options considered:** `navigator.clipboard.write` with a `ClipboardItem` in the
  renderer; Electron `clipboard.writeImage` in main.
- **Chosen:** main, through two IPC calls with the PNG bytes.
- **Why:** the web clipboard API needs focus and permission rules that differ between
  platforms; Electron's clipboard does not. Saving a file must be in main anyway (§III,
  the same pattern as `main/calendar.ts`). Main validates the bytes with zod: a
  `Uint8Array`, at most 5 MB, starting with the PNG signature; `nativeImage` must decode it.

### D-3 — A light palette in TypeScript, checked against the CSS

- **Why:** the canvas cannot use the CSS variables of the light theme while the app is
  dark (FR-014). `palette.ts` keeps the light values of the tokens that the card uses;
  a unit test reads `styles/global.css` and fails if a value differs, so there is still
  one source of the colours.

### D-4 — The text fits by measure, not by a fixed size

- `fitFontSize(text, maxWidth, start, min, measure)` is pure: it lowers the size until
  `measure` (the canvas `measureText`) fits the width, then the text is cut with "…" at
  the minimum. Unit-tested with a fake measure (FR-016).

### D-5 — The preview has a text alternative

- The `<img>` has a short `alt`, and a visually hidden list repeats the title, period,
  tiles and funnel. Screen readers get the numbers (WCAG 1.1.1), and e2e checks them
  against the screen (SC-002) without decoding the image.

### D-6 — The file name is made in main

- `findy-analytics-YYYY-MM-DD.png` from main's local date, the same way as the CSV export.
  The renderer sends only bytes.

## Risks

- **Fonts differ by platform.** The canvas uses the app font stack (`system-ui`, …), so
  widths change. Mitigation: D-4 measures each text on the real canvas.
- **The logo is not loaded when the user clicks.** Mitigation: `draw.ts` waits for
  `image.decode()` before it draws.
- **The clipboard in CI on Linux** needs a display. Mitigation: e2e already runs with a
  display (xvfb) and takes the clipboard lock (`withClipboardLock`).
