import type { StageId } from '@domain/stages'

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

/** The light `--chart-<stage>` colours of the funnel bars */
export const LIGHT_CHART: Record<StageId, string> = {
  applied: '#0a66c2',
  hr_interview: '#7b3fbf',
  test_task: '#b35c00',
  technical_interview: '#00796b',
  c_level_interview: '#c2185b',
  offered: '#2e7d32',
  rejected: '#6b7280',
}

/** The font stack of the app (styles/global.css) */
export const FONT_FAMILY = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
