import Database from 'better-sqlite3'

/**
 * Verifies that a packaged build can load its native dependencies.
 * Run with FINDY_SMOKE_TEST=1; used by scripts/smoke-packaged.mjs in CI.
 */
export function runSmokeTest(): number {
  try {
    const db = new Database(':memory:')
    const { version } = db.prepare('SELECT sqlite_version() AS version').get() as {
      version: string
    }
    db.close()
    console.log(`FINDY_SMOKE_OK sqlite=${version}`)
    return 0
  } catch (error) {
    console.error('FINDY_SMOKE_FAIL', error)
    return 1
  }
}
