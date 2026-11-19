import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  customSiteUrl,
  KNOWN_SITES,
  knownSiteUrl,
  SITE_GROUPS,
  SITE_LIMITS,
  siteHost,
  type CustomSite,
  type KnownSiteId,
  type SiteFormValues,
} from '@domain/sites'
import { Button, ConfirmDialog, TextField } from '@ui'
import { HiddenSites } from '../HiddenSites'
import { SiteDialog } from '../SiteDialog'
import { SiteTile } from '../SiteTile'
import styles from './SitesView.module.css'

interface Props {
  sites: CustomSite[]
  hiddenSites: KnownSiteId[]
  query: string
  /** Host → `data:` URL (FR-020) */
  icons: Record<string, string>
  onQueryChange(query: string): void
  onOpen(url: string): void
  /** Resolve to true when saved, so the dialog closes */
  onAdd(site: SiteFormValues): Promise<boolean>
  onUpdate(id: string, site: SiteFormValues): Promise<boolean>
  onDelete(id: string): void
  onHiddenChange(ids: KnownSiteId[]): void
  /** FR-021: on every opening of the tab */
  onShown(): void
}

/** Wait before saving the query, so typing does not save every letter */
const SAVE_QUERY_MS = 400

/** Spec 011: the job sites, one search query for all, and the user's own sites. */
export function SitesView(props: Props) {
  const { sites, hiddenSites, icons, onOpen, onHiddenChange } = props
  const { t } = useTranslation()
  const [query, setQuery] = useState(props.query)
  const [editing, setEditing] = useState<CustomSite | 'new' | null>(null)
  const [deleting, setDeleting] = useState<CustomSite | null>(null)
  const pending = useRef<ReturnType<typeof setTimeout>>(undefined)

  const { onQueryChange } = props
  // FR-021: once per opening of the tab (the view mounts with the tab)
  const shown = useEffectEvent(props.onShown)
  useEffect(() => shown(), [])

  // FR-005: saved shortly after typing stops, and at once when the field loses focus
  const saveQuery = (value: string) => {
    clearTimeout(pending.current)
    if (value.trim() !== props.query) onQueryChange(value)
  }
  useEffect(() => () => clearTimeout(pending.current), [])

  const known = KNOWN_SITES.filter((site) => !(hiddenSites as string[]).includes(site.id))
  const hidden = KNOWN_SITES.filter((site) => (hiddenSites as string[]).includes(site.id))

  return (
    <div className={styles.view}>
      <div className={styles.query}>
        <TextField
          name="siteQuery"
          type="search"
          label={t('sites.query.label')}
          hint={t('sites.query.hint')}
          placeholder={t('sites.query.placeholder')}
          maxLength={SITE_LIMITS.query}
          value={query}
          autoComplete="off"
          onChange={(event) => {
            const value = event.target.value
            setQuery(value)
            clearTimeout(pending.current)
            pending.current = setTimeout(() => saveQuery(value), SAVE_QUERY_MS)
          }}
          onBlur={() => saveQuery(query)}
        />
      </div>

      {SITE_GROUPS.map((group) => {
        const items = known.filter((site) => site.group === group)
        if (items.length === 0) return null
        return (
          <section key={group} className={styles.group} aria-labelledby={`sites-${group}`}>
            <h2 id={`sites-${group}`} className={styles.title}>
              {t(`sites.groups.${group}`)}
            </h2>
            <ul className={styles.grid}>
              {items.map((site) => {
                const host = siteHost(site.jobsUrl)
                return (
                  <SiteTile
                    key={site.id}
                    name={site.name}
                    host={host}
                    icon={icons[host]}
                    onOpen={() => onOpen(knownSiteUrl(site, query))}
                    actions={[
                      {
                        key: 'hide',
                        label: t('sites.hide'),
                        onSelect: () => onHiddenChange([...hiddenSites, site.id]),
                      },
                    ]}
                  />
                )
              })}
            </ul>
          </section>
        )
      })}

      <section className={styles.group} aria-labelledby="sites-mine">
        <div className={styles.heading}>
          <h2 id="sites-mine" className={styles.title}>
            {t('sites.groups.mine')}
          </h2>
          <Button
            size="small"
            disabled={sites.length >= SITE_LIMITS.count}
            title={
              sites.length >= SITE_LIMITS.count
                ? t('sites.limit', { max: SITE_LIMITS.count })
                : undefined
            }
            onClick={() => setEditing('new')}
          >
            {t('sites.add')}
          </Button>
        </div>
        {sites.length > 0 && (
          <ul className={styles.grid}>
            {sites.map((site) => {
              const host = siteHost(site.url)
              return (
                <SiteTile
                  key={site.id}
                  name={site.name}
                  host={host}
                  icon={icons[host]}
                  onOpen={() => onOpen(customSiteUrl(site, query))}
                  actions={[
                    { key: 'edit', label: t('sites.edit'), onSelect: () => setEditing(site) },
                    {
                      key: 'delete',
                      label: t('sites.delete'),
                      danger: true,
                      onSelect: () => setDeleting(site),
                    },
                  ]}
                />
              )
            })}
          </ul>
        )}
      </section>

      <HiddenSites
        sites={hidden}
        onShow={(id) => onHiddenChange(hiddenSites.filter((item) => item !== id))}
      />

      {editing && (
        <SiteDialog
          initial={editing === 'new' ? undefined : { name: editing.name, url: editing.url }}
          onClose={() => setEditing(null)}
          onSave={async (site) => {
            const saved =
              editing === 'new' ? await props.onAdd(site) : await props.onUpdate(editing.id, site)
            if (saved) setEditing(null)
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title={t('sites.deleteConfirm.title')}
          message={t('sites.deleteConfirm.message', { name: deleting.name })}
          confirmLabel={t('sites.deleteConfirm.confirm')}
          cancelLabel={t('form.cancel')}
          onConfirm={() => {
            props.onDelete(deleting.id)
            setDeleting(null)
          }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
