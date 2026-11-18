import { z } from 'zod'
import { isHttpUrl } from '../domain/limits'
import { isCheckDue, isNewer, normalizeVersion } from '../domain/updates'
import type { UpdateCheckResult, UpdateTrigger } from '../shared/ipc'

/** Spec 006 FR-005: the latest published, stable release (drafts and pre-releases excluded) */
export const RELEASES_URL = 'https://api.github.com/repos/YuraBerez/findy/releases/latest'
/** "Download" may open only a release page of this repository (plan D-1) */
export const RELEASE_PAGE_PREFIX = 'https://github.com/YuraBerez/findy/releases/'

const TIMEOUT_MS = 10_000
const MAX_CHARS = 1_000_000

const ReleaseSchema = z.object({
  tag_name: z.string(),
  html_url: z.string(),
  draft: z.boolean(),
  prerelease: z.boolean(),
})

/** The check failed: no network, a timeout, an error status or an answer we cannot use. */
export class UpdateCheckError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UpdateCheckError'
  }
}

export interface LatestRelease {
  version: string
  url: string
}

export interface FetchOptions {
  url?: string
  timeoutMs?: number
}

/**
 * FR-005, FR-011, FR-012: one anonymous GET for public release data. Sends no user
 * data; ends after 10 s; rejects anything that is not a stable release of this repository.
 */
export async function fetchLatestRelease(
  fetchFn: typeof fetch,
  { url = RELEASES_URL, timeoutMs = TIMEOUT_MS }: FetchOptions = {},
): Promise<LatestRelease> {
  let text: string
  try {
    const response = await fetchFn(url, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'Findy' },
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!response.ok) throw new UpdateCheckError(`HTTP ${response.status}`)
    text = await response.text()
  } catch (error) {
    if (error instanceof UpdateCheckError) throw error
    throw new UpdateCheckError(error instanceof Error ? error.message : String(error))
  }
  if (text.length > MAX_CHARS) throw new UpdateCheckError('The answer is too large')

  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new UpdateCheckError('The answer is not JSON')
  }
  const parsed = ReleaseSchema.safeParse(json)
  if (!parsed.success) throw new UpdateCheckError('The answer is not a release')
  const release = parsed.data
  if (release.draft || release.prerelease) throw new UpdateCheckError('Not a stable release')
  const version = normalizeVersion(release.tag_name)
  if (!version) throw new UpdateCheckError(`Not a version: ${release.tag_name}`)
  if (!isHttpUrl(release.html_url) || !release.html_url.startsWith(RELEASE_PAGE_PREFIX))
    throw new UpdateCheckError('The release page is not in this repository')
  return { version, url: release.html_url }
}

export interface UpdateSettings {
  autoCheck(): boolean
  lastCheck(): string | null
  recordCheck(at: string): void
}

export interface UpdateCheckerDeps {
  fetchLatest(): Promise<LatestRelease>
  currentVersion: string
  /** `null` when the database is not available: then there is no automatic check */
  settings: UpdateSettings | null
  now?: () => Date
}

/**
 * FR-003, FR-004, FR-009, FR-010: a manual check always runs and reports failures; an
 * automatic one runs only when it is on and due, and never fails. One request at a time.
 */
export function createUpdateChecker({
  fetchLatest,
  currentVersion,
  settings,
  now = () => new Date(),
}: UpdateCheckerDeps) {
  let running: Promise<LatestRelease> | null = null

  const latest = (): Promise<LatestRelease> => {
    running ??= fetchLatest().finally(() => {
      settings?.recordCheck(now().toISOString())
      running = null
    })
    return running
  }

  return async function check(trigger: UpdateTrigger): Promise<UpdateCheckResult | null> {
    if (trigger === 'auto' && !(settings?.autoCheck() && isCheckDue(settings.lastCheck(), now())))
      return null
    try {
      const release = await latest()
      return isNewer(release.version, currentVersion)
        ? { status: 'available', version: release.version, currentVersion, url: release.url }
        : { status: 'latest', currentVersion }
    } catch (error) {
      if (trigger === 'auto') return null
      throw error instanceof UpdateCheckError ? error : new UpdateCheckError(String(error))
    }
  }
}
