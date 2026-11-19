import { useTranslation } from 'react-i18next'
import { Button, ClockIcon } from '@ui'
import styles from './StaleToggle.module.css'

interface Props {
  /** Stale applications in the visible columns (FR-005, FR-010) */
  count: number
  pressed: boolean
  onToggle(): void
}

/**
 * Spec 010 FR-005: show only stale applications; disabled when there are none. On a
 * narrow window only the icon and the count show; the full text stays the button's name.
 */
export function StaleToggle({ count, pressed, onToggle }: Props) {
  const { t } = useTranslation()
  const label = t('stale.toggle', { count })
  return (
    <Button pressed={pressed} disabled={count === 0} onClick={onToggle} title={label}>
      <ClockIcon size={15} />
      <span className={styles.full}>{label}</span>
      <span className={styles.short} aria-hidden="true">
        {count}
      </span>
    </Button>
  )
}
