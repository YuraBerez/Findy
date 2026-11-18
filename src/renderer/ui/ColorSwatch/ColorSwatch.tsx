import type { CSSProperties } from 'react'
import styles from './ColorSwatch.module.css'

interface Props {
  /** A CSS colour; `null` shows an empty, crossed-out circle ("no colour") */
  color: string | null
  size?: number
}

/** A small colour sample. Decorative: the label next to it names the colour. */
export function ColorSwatch({ color, size = 14 }: Props) {
  const style = { '--swatch': color ?? undefined, '--size': `${size}px` } as CSSProperties
  return (
    <span
      className={styles.swatch}
      data-empty={color === null || undefined}
      style={style}
      aria-hidden="true"
    />
  )
}
