/** Spec 020 NFR-003: where this browser keeps the theme that the visitor picked */
export const THEME_KEY = 'findy-theme'

export type Theme = 'light' | 'dark'

/** A saved value, or null when it is missing or not a theme (then the system theme applies) */
export const parseTheme = (value: string | null): Theme | null =>
  value === 'light' || value === 'dark' ? value : null
