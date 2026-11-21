// Spec 014 FR-020, FR-042: the source of an application from its link or from text.
import { normalizeName } from '../transfer/columns'
import { isKnownSiteId, KNOWN_SITES, siteHost, type CustomSite } from '../sites'
import { LIMITS } from '../limits'
import { SOURCE_CHANNELS, type ApplicationSource, type SourceChannel } from './types'

/** The host of a link without `www.`, in lower case; empty for a bad link */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return ''
  }
}

/** The same host, or a subdomain of it */
function matchesHost(host: string, siteHostName: string): boolean {
  const site = siteHostName.toLowerCase()
  return site !== '' && (host === site || host.endsWith(`.${site}`))
}

/** FR-020: the job site of a link; known sites first, then the user's sites */
export function sourceFromUrl(
  url: string | null,
  customSites: readonly CustomSite[],
): ApplicationSource | null {
  const host = url ? hostOf(url) : ''
  if (!host) return null
  const known = KNOWN_SITES.find((site) => matchesHost(host, siteHost(site.jobsUrl)))
  if (known) return { kind: 'site', id: known.id }
  const custom = customSites.find((site) => matchesHost(host, siteHost(site.url)))
  return custom ? { kind: 'custom', name: custom.name } : null
}

/** The name of a source; channel names come from the caller's language */
export function sourceName(
  source: ApplicationSource,
  channelNames: Record<SourceChannel, string>,
): string {
  if (source.kind === 'site') return KNOWN_SITES.find((site) => site.id === source.id)!.name
  if (source.kind === 'custom') return source.name
  return channelNames[source.id]
}

/**
 * FR-042 and the MCP tools: a known site or a channel by id or name (any of the given
 * languages), else the name of a custom site. `null` for empty text, `undefined` when
 * the name is too long.
 */
export function parseSourceText(
  text: string,
  channelNames: readonly Record<SourceChannel, string>[],
): ApplicationSource | null | undefined {
  const value = text.trim()
  if (!value) return null
  const key = normalizeName(value)
  const site = KNOWN_SITES.find(
    (known) => normalizeName(known.id) === key || normalizeName(known.name) === key,
  )
  if (site && isKnownSiteId(site.id)) return { kind: 'site', id: site.id }
  const channel = SOURCE_CHANNELS.find(
    (id) => id === key || channelNames.some((names) => normalizeName(names[id]) === key),
  )
  if (channel) return { kind: 'channel', id: channel }
  return value.length <= LIMITS.siteName ? { kind: 'custom', name: value } : undefined
}
