// Spec 011 FR-002: the job sites that Findy knows. The only place with their addresses.

/** FR-002: groups, in tab order */
export const SITE_GROUPS = ['ukraine', 'international', 'remote', 'europe'] as const
export type SiteGroup = (typeof SITE_GROUPS)[number]

/**
 * How a query goes into a search template (plan D-1):
 * `component` — URL-encoded; `plus` — URL-encoded with spaces as `+`;
 * `slug` — lower case, words joined by `-`, then URL-encoded.
 */
export type QueryEncoding = 'component' | 'plus' | 'slug'

export interface KnownSite {
  id: string
  name: string
  group: SiteGroup
  /** Opened for an empty query, or always when there is no `search` */
  jobsUrl: string
  /** The search results address with `{query}`; none when the site has no stable one */
  search?: { template: string; encoding: QueryEncoding }
}

export const KNOWN_SITES = [
  {
    id: 'djinni',
    name: 'Djinni',
    group: 'ukraine',
    jobsUrl: 'https://djinni.co/jobs/',
    search: {
      template: 'https://djinni.co/jobs/?all_keywords={query}&search_type=full-text',
      encoding: 'component',
    },
  },
  {
    id: 'dou',
    name: 'DOU',
    group: 'ukraine',
    jobsUrl: 'https://jobs.dou.ua/vacancies/',
    search: { template: 'https://jobs.dou.ua/vacancies/?search={query}', encoding: 'component' },
  },
  {
    id: 'workua',
    name: 'Work.ua',
    group: 'ukraine',
    jobsUrl: 'https://www.work.ua/jobs/',
    search: { template: 'https://www.work.ua/jobs-{query}/', encoding: 'plus' },
  },
  {
    id: 'robotaua',
    name: 'robota.ua',
    group: 'ukraine',
    jobsUrl: 'https://robota.ua/zapros/ukraine',
    search: { template: 'https://robota.ua/zapros/{query}/ukraine', encoding: 'slug' },
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Jobs',
    group: 'international',
    jobsUrl: 'https://www.linkedin.com/jobs/',
    search: {
      template: 'https://www.linkedin.com/jobs/search/?keywords={query}',
      encoding: 'component',
    },
  },
  {
    id: 'indeed',
    name: 'Indeed',
    group: 'international',
    jobsUrl: 'https://www.indeed.com/',
    search: { template: 'https://www.indeed.com/jobs?q={query}', encoding: 'component' },
  },
  {
    id: 'glassdoor',
    name: 'Glassdoor',
    group: 'international',
    jobsUrl: 'https://www.glassdoor.com/Job/index.htm',
    search: {
      template: 'https://www.glassdoor.com/Job/jobs.htm?sc.keyword={query}',
      encoding: 'component',
    },
  },
  { id: 'wellfound', name: 'Wellfound', group: 'remote', jobsUrl: 'https://wellfound.com/jobs' },
  { id: 'remoteok', name: 'Remote OK', group: 'remote', jobsUrl: 'https://remoteok.com/' },
  {
    id: 'weworkremotely',
    name: 'We Work Remotely',
    group: 'remote',
    jobsUrl: 'https://weworkremotely.com/',
    search: {
      template: 'https://weworkremotely.com/remote-jobs/search?term={query}',
      encoding: 'component',
    },
  },
  {
    id: 'jooble',
    name: 'Jooble',
    group: 'europe',
    jobsUrl: 'https://jooble.org/',
    search: { template: 'https://jooble.org/SearchResult?ukw={query}', encoding: 'component' },
  },
  { id: 'eurojobs', name: 'EuroJobs', group: 'europe', jobsUrl: 'https://www.eurojobs.com/' },
  {
    id: 'stepstone',
    name: 'StepStone',
    group: 'europe',
    jobsUrl: 'https://www.stepstone.de/',
    search: { template: 'https://www.stepstone.de/jobs/{query}', encoding: 'slug' },
  },
  {
    id: 'xing',
    name: 'XING',
    group: 'europe',
    jobsUrl: 'https://www.xing.com/jobs',
    search: {
      template: 'https://www.xing.com/jobs/search?keywords={query}',
      encoding: 'component',
    },
  },
] as const satisfies readonly KnownSite[]

export type KnownSiteId = (typeof KNOWN_SITES)[number]['id']

export const KNOWN_SITE_IDS = KNOWN_SITES.map((site) => site.id) as readonly KnownSiteId[]

export function isKnownSiteId(value: unknown): value is KnownSiteId {
  return typeof value === 'string' && (KNOWN_SITE_IDS as readonly string[]).includes(value)
}
