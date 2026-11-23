# Brand

## Logo

<img src="../assets/logo.svg" width="96" alt="Findy logo">

The logo is a white letter **F** on a blue rounded square. The F is made of kanban
cards: one tall column and two cards. This shows the board that the app is about.

| File | Use |
|------|-----|
| `assets/logo.svg` | Source of truth. README, docs, full-bleed icons (Windows, Linux) |
| `build/icon-macos.svg` | macOS variant on the Apple icon grid (824 px body on a 1024 px canvas) |
| `build/icon.png` | 1024 px, Linux and fallback (generated) |
| `build/icon.icns` | macOS, 16–1024 px (generated) |
| `build/icon.ico` | Windows, 16–256 px (generated) |

Do not edit the generated files by hand. Change the SVG, then generate them again.
Do not add effects (gradients, shadows) to the mark: it must stay readable at 16 px.

## Colours

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `--primary` | `#0A66C2` | `#4A9DE8` | Logo, primary buttons, focus rings, links |
| `--on-primary` | `#FFFFFF` | `#0B1520` | Text and icons on `--primary` (dark text in dark theme for AA contrast) |

The dark-theme primary is lighter, so it keeps enough contrast on the dark background.

### Chart colours (spec 005)

One colour per stage, the same in every chart. Each one has a contrast of 3:1 or more
against `--surface` and `--bg` in its theme (WCAG 1.4.11). Labels in the legend and the
tables carry the meaning, so colour is never the only signal.

| Token | Light | Dark |
|-------|-------|------|
| `--chart-applied` | `#0A66C2` | `#4A9DE8` |
| `--chart-hr_interview` | `#7B3FBF` | `#B28AF0` |
| `--chart-test_task` | `#B35C00` | `#F0A14A` |
| `--chart-technical_interview` | `#00796B` | `#4DB6AC` |
| `--chart-c_level_interview` | `#C2185B` | `#F06292` |
| `--chart-offered` | `#2E7D32` | `#66BB6A` |
| `--chart-rejected` | `#6B7280` | `#9AA3B0` |
Tokens live in `src/renderer/styles/global.css`.

### Website (spec 020)

The website uses the same palette. Its tokens live in `website/src/styles/global.css`;
components use only these tokens (a unit test fails on a raw colour in a component).

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `--primary` | `#0A66C2` | `#4A9DE8` | Links, icons, focus rings, outlines |
| `--button` / `--on-button` | `#0A66C2` / `#FFFFFF` | same | Filled buttons and badges: the brand primary in both themes (5.8:1) |
| `--bg`, `--surface`, `--fg`, `--fg-muted`, `--border` | as the app | as the app | Page, cards, text, lines |
| `--chart-<stage>` | as above | as above | Stage dots in the stage flow |
| `--primary-soft` | primary 14 % | primary 14 % | Icon tiles, glow behind a main block |
| `--primary-faint` | primary 30 % | primary 30 % | Slider dots that are not active |
| `--primary-line` | primary 45 % | primary 45 % | Borders of secondary buttons and controls |
| `--primary-hover` | primary 12 % on `--surface` | same | Hover of controls and rows |
| `--terminal-*` | dark | dark | Command boxes: the same dark colours in both themes; the accent is the dark `--primary`, the prompt is the dark `--chart-offered` |

Do not add a colour in a component. Add a token here and in `global.css` first.

Findy is not affiliated with any job platform. Do not use other companies' logos or
names in the Findy brand.
