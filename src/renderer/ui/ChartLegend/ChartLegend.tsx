import styles from './ChartLegend.module.css'

export interface LegendItem {
  key: string
  label: string
  color: string
  shown: boolean
}

interface Props {
  /** Accessible name of the group of toggles */
  label: string
  items: LegendItem[]
  onToggle(key: string): void
}

/** Series names with their colour; each one is a toggle button (aria-pressed). */
export function ChartLegend({ label, items, onToggle }: Props) {
  return (
    <ul className={styles.legend} aria-label={label}>
      {items.map((item) => (
        <li key={item.key}>
          <button
            type="button"
            className={styles.item}
            aria-pressed={item.shown}
            onClick={() => onToggle(item.key)}
          >
            <span
              className={styles.swatch}
              style={item.shown ? { background: item.color } : undefined}
              aria-hidden="true"
            />
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  )
}
