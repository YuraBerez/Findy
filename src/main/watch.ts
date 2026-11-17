/**
 * Spec 004 FR-006: notices commits made by another process (the MCP server).
 * SQLite's `PRAGMA data_version` changes only when *another* connection commits,
 * so the app's own writes never trigger a reload. Returns a stop function.
 */
export function watchExternalChanges(
  readVersion: () => number,
  onChange: () => void,
  intervalMs = 1000,
): () => void {
  let last = readVersion()
  const timer = setInterval(() => {
    const current = readVersion()
    if (current !== last) {
      last = current
      onChange()
    }
  }, intervalMs)
  return () => clearInterval(timer)
}
