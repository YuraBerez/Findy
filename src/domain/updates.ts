// Spec 006: is a release newer, and is an automatic check due

/** FR-004: at most one automatic check per day */
export const AUTO_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000

interface Version {
  core: [number, number, number]
  pre: string[]
}

const SEMVER =
  /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/

function parse(value: string): Version | null {
  const match = SEMVER.exec(value.trim())
  if (!match) return null
  const [, major, minor, patch, pre] = match
  return { core: [Number(major), Number(minor), Number(patch)], pre: pre ? pre.split('.') : [] }
}

/** The version without a leading "v" ("v0.2.0" → "0.2.0"), or null if it is not SemVer. */
export function normalizeVersion(value: string): string | null {
  return parse(value) ? value.trim().replace(/^v/, '').replace(/\+.*$/, '') : null
}

function comparePre(a: string[], b: string[]): number {
  // A release is greater than its pre-releases (SemVer §11.3)
  if (!a.length || !b.length) return b.length - a.length
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const [x, y] = [a[i], b[i]]
    if (x === undefined) return -1
    if (y === undefined) return 1
    const [nx, ny] = [/^\d+$/.test(x), /^\d+$/.test(y)]
    if (nx && ny && Number(x) !== Number(y)) return Number(x) - Number(y)
    if (nx !== ny) return nx ? -1 : 1
    if (x !== y) return x < y ? -1 : 1
  }
  return 0
}

/** SemVer order: negative, 0 or positive; null when either value is not a version. */
export function compareVersions(a: string, b: string): number | null {
  const [x, y] = [parse(a), parse(b)]
  if (!x || !y) return null
  for (let i = 0; i < 3; i++) if (x.core[i] !== y.core[i]) return x.core[i]! - y.core[i]!
  return comparePre(x.pre, y.pre)
}

/** FR-006: an invalid version is never newer. */
export function isNewer(release: string, current: string): boolean {
  return (compareVersions(release, current) ?? 0) > 0
}

/** FR-004: due when never checked, 24 h passed, or the clock went back. */
export function isCheckDue(lastCheckAt: string | null, now: Date): boolean {
  if (!lastCheckAt) return true
  const last = Date.parse(lastCheckAt)
  if (Number.isNaN(last) || last > now.getTime()) return true
  return now.getTime() - last >= AUTO_CHECK_INTERVAL_MS
}
