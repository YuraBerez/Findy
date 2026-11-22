/**
 * Spec 019: the connector entry. The browser starts it through the launcher for the
 * Findy extension, in Node mode with Findy's own binary, as the MCP server (architecture
 * D-8, D-18). One request, one answer, then exit. Never imports Electron. stdout carries
 * the answer, so every log goes to stderr.
 */
import { mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { openDatabase } from '../db/connection'
import { Repository } from '../db/repository'
import { userDataDir } from '../paths'
import { runConnector } from './run'

console.log = console.info = console.debug = console.error
// out/main/connector.js → package.json of the app (inside app.asar when packaged)
const { version } = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf8'),
) as {
  version: string
}

void runConnector({
  version,
  open: () => {
    const dir = userDataDir()
    mkdirSync(dir, { recursive: true })
    const opened = openDatabase(dir)
    return {
      repository: opened.status === 'ok' ? new Repository(opened.db) : null,
      storageProblem: `Findy cannot open its database (${opened.dataFilePath}). Open the Findy app to see what is wrong.`,
      close: () => {
        if (opened.status === 'ok') opened.db.close()
      },
    }
  },
}).then((code) => process.exit(code))
