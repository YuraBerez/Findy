import { LATEST_RELEASE_API_URL } from '../../../src/shared/project'
import { parseRelease, type Release, type ReleaseJson } from '../lib/release'

let latest: Promise<Release> | undefined

/**
 * Spec 020 FR-010, FR-032: the latest release, read once per build. A failed request
 * fails the build, so the published website stays as it was.
 */
export function latestRelease(): Promise<Release> {
  latest ??= (async () => {
    const token = process.env.GITHUB_TOKEN
    const response = await fetch(LATEST_RELEASE_API_URL, {
      headers: {
        Accept: 'application/vnd.github+json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
    if (!response.ok) {
      throw new Error(`Latest release: HTTP ${response.status} from ${LATEST_RELEASE_API_URL}`)
    }
    return parseRelease((await response.json()) as ReleaseJson)
  })()
  return latest
}
