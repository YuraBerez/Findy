import { useId, useState, type KeyboardEvent } from 'react'
import styles from './BarChart.module.css'

export interface BarSeries {
  key: string
  /** A CSS colour, e.g. `var(--chart-applied)` */
  color: string
  values: number[]
}

interface Props {
  /** Accessible name of the chart */
  label: string
  /** Short axis label of each bar */
  categories: string[]
  /** Stacked from the bottom, in this order */
  series: BarSeries[]
  /** The text for one bar: shown on hover and keyboard focus (spec 005 FR-025) */
  describe(index: number): string
  /** The text when no bar is selected */
  hint: string
}

/** Most axis labels before they thin out, so long periods stay readable */
const MAX_LABELS = 8

/**
 * Stacked bar chart in plain HTML and CSS. One tab stop: Left, Right, Home and End move a
 * cursor over the bars, and the caption reads the value aloud (aria-live).
 */
export function BarChart({ label, categories, series, describe, hint }: Props) {
  const captionId = useId()
  const [cursor, setCursor] = useState<number | null>(null)
  const count = categories.length
  const totals = categories.map((_, i) => series.reduce((sum, s) => sum + (s.values[i] ?? 0), 0))
  const max = niceMax(Math.max(0, ...totals))
  const every = Math.ceil(count / MAX_LABELS)
  const active = cursor !== null && cursor < count ? cursor : null

  const onKeyDown = (event: KeyboardEvent) => {
    const last = count - 1
    const from = active ?? -1
    const next = {
      ArrowRight: Math.min(last, from + 1),
      ArrowLeft: Math.max(0, active === null ? last : from - 1),
      Home: 0,
      End: last,
    }[event.key]
    if (next === undefined || count === 0) return
    event.preventDefault()
    setCursor(next)
  }

  return (
    <figure className={styles.figure}>
      <div
        role="group"
        aria-label={label}
        aria-describedby={captionId}
        tabIndex={0}
        className={styles.plot}
        onKeyDown={onKeyDown}
        onBlur={() => setCursor(null)}
        onMouseLeave={() => setCursor(null)}
      >
        <div className={styles.axis} aria-hidden="true">
          <span>{max}</span>
          <span>{max / 2}</span>
          <span>0</span>
        </div>
        <div className={styles.bars} aria-hidden="true">
          {categories.map((category, i) => (
            <div
              key={i}
              className={styles.bucket}
              data-active={active === i || undefined}
              onMouseEnter={() => setCursor(i)}
            >
              <div className={styles.stack}>
                {series.map((s) =>
                  s.values[i] ? (
                    <div
                      key={s.key}
                      className={styles.segment}
                      style={{ height: `${(s.values[i] / max) * 100}%`, background: s.color }}
                    />
                  ) : null,
                )}
              </div>
              <span className={styles.label}>{i % every === 0 ? category : ''}</span>
            </div>
          ))}
        </div>
      </div>
      <figcaption id={captionId} className={styles.caption} aria-live="polite">
        {active === null ? hint : describe(active)}
      </figcaption>
    </figure>
  )
}

/** 0 → 2, 7 → 8, 13 → 14: an even top so the middle line is a whole number */
function niceMax(value: number): number {
  return Math.max(2, value + (value % 2))
}
