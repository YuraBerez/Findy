import { useTranslation } from 'react-i18next'
import { CARD_COLORS, type CardColor } from '@domain/colors'
import type { ColorOption } from '@ui'

/** Key of the "no colour" option; every other key is a CardColor */
const NONE = 'none'

/** The CSS colour of a card colour: one token per colour and theme (global.css) */
export function colorToken(color: CardColor): string {
  return `var(--card-${color})`
}

/** Spec 007 FR-002, FR-003: "None" and the palette, in order, with translated names. */
export function useColorOptions() {
  const { t } = useTranslation()
  const name = (color: CardColor | null) => (color ? t(`colors.${color}`) : t('colors.none'))
  const options: ColorOption[] = [
    { key: NONE, label: name(null), color: null },
    ...CARD_COLORS.map((color) => ({ key: color, label: name(color), color: colorToken(color) })),
  ]
  return {
    options,
    name,
    keyOf: (color: CardColor | null) => color ?? NONE,
    colorOf: (key: string) => (key === NONE ? null : (key as CardColor)),
  }
}
