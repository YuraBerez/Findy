import { useTranslation } from 'react-i18next'
import { Menu, MoreIcon, type MenuEntry } from '@ui'
import styles from './SiteTile.module.css'

interface Props {
  name: string
  /** Shown under the name and used as the icon key */
  host: string
  /** A saved icon as a `data:` URL; else the first letter (FR-020) */
  icon: string | undefined
  onOpen(): void
  /** Hide (known sites) or Edit / Delete (the user's sites) */
  actions: MenuEntry[]
}

const LETTER_COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'grey'] as const

/** FR-020: the same colour for the same name every time */
function letterColor(name: string): string {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.codePointAt(0)!) >>> 0
  return `var(--card-${LETTER_COLORS[hash % LETTER_COLORS.length]})`
}

/** Spec 011 FR-004, FR-006: a site with its icon, name and host; a click opens it. */
export function SiteTile({ name, host, icon, onOpen, actions }: Props) {
  const { t } = useTranslation()
  return (
    <li className={styles.tile}>
      <button type="button" className={styles.open} onClick={onOpen}>
        {icon ? (
          <img
            className={styles.icon}
            src={icon}
            alt=""
            width={32}
            height={32}
            data-testid="site-icon"
          />
        ) : (
          <span
            className={styles.letter}
            style={{ '--letter-color': letterColor(name) } as React.CSSProperties}
            aria-hidden="true"
          >
            {Array.from(name)[0]?.toLocaleUpperCase()}
          </span>
        )}
        <span className={styles.text}>
          <span className={styles.name}>{name}</span>
          <span className={styles.host}>{host}</span>
        </span>
      </button>
      <Menu
        triggerLabel={t('sites.actions', { name })}
        triggerIcon={<MoreIcon />}
        label={t('sites.actions', { name })}
        items={actions}
      />
    </li>
  )
}
