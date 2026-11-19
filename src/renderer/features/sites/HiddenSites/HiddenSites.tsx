import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { KnownSite } from '@domain/sites'
import { Button } from '@ui'
import styles from './HiddenSites.module.css'

interface Props {
  sites: readonly KnownSite[]
  onShow(id: string): void
}

/** Spec 011 FR-016: "Show hidden sites (N)" with a Show button for each one. */
export function HiddenSites({ sites, onShow }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const listId = useId()
  if (sites.length === 0) return null
  return (
    <section className={styles.hidden}>
      <Button
        variant="ghost"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen(!open)}
      >
        {t('sites.hidden', { count: sites.length })}
      </Button>
      {open && (
        <ul id={listId} className={styles.list}>
          {sites.map((site) => (
            <li key={site.id} className={styles.row}>
              <span>{site.name}</span>
              <Button
                size="small"
                aria-label={t('sites.showSite', { name: site.name })}
                onClick={() => onShow(site.id)}
              >
                {t('sites.show')}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
