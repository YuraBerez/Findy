// Card colours (spec 007 FR-001). Zod-free, so the renderer can use it (limits.ts).
export const CARD_COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'grey'] as const

export type CardColor = (typeof CARD_COLORS)[number]

export function isCardColor(value: unknown): value is CardColor {
  return typeof value === 'string' && (CARD_COLORS as readonly string[]).includes(value)
}
