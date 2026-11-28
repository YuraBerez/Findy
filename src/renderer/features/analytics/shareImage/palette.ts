/**
 * Spec 023 FR-014, plan D-3: the image is always light, so it cannot read the CSS variables
 * while the app is dark. These are the light values of the tokens in styles/global.css;
 * tests/unit/renderer/share-image.test.ts fails if one differs.
 */
export const LIGHT = {
  primary: '#0a66c2',
  bg: '#f4f6f8',
  surface: '#ffffff',
  fg: '#1c1f24',
  'fg-muted': '#5b6370',
  border: '#d9dee5',
} as const

/** The font stack of the app (styles/global.css) */
export const FONT_FAMILY = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
