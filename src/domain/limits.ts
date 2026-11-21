// Zod-free rules shared with the renderer: zod v4 probes `new Function()` on load,
// which the renderer's CSP blocks (and the e2e error guard reports).

export const LIMITS = {
  title: 200,
  company: 200,
  url: 2048,
  note: 10_000,
  /** Spec 014 FR-001 */
  salary: 1_000_000_000,
  location: 100,
  /** The name of a custom site (spec 011); a custom source keeps it (spec 014) */
  siteName: 60,
  contactName: 100,
  contactDetails: 200,
} as const

export function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}
