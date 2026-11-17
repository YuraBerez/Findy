/**
 * Spec 004: the MCP server entry. It runs in Node mode (ELECTRON_RUN_AS_NODE=1)
 * with Findy's own binary: no Chromium, no window, no helper processes, and
 * stdio that works on Windows too (architecture D-8). Never imports Electron.
 * stdout carries the protocol, so every log goes to stderr.
 */
import { mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { openDatabase } from '../db/connection'
import { Repository } from '../db/repository'
import { userDataDir } from '../paths'
import { runMcpServer } from './server'

async function main(): Promise<void> {
  console.log = console.info = console.debug = console.error
  // out/main/mcp.js → package.json of the app (inside app.asar when packaged)
  const { version } = JSON.parse(
    readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf8'),
  ) as {
    version: string
  }
  const dir = userDataDir()
  mkdirSync(dir, { recursive: true })
  const opened = openDatabase(dir)
  const repository = opened.status === 'ok' ? new Repository(opened.db) : null
  await runMcpServer(
    repository,
    version,
    `Findy cannot open its database (${opened.dataFilePath}). Open the Findy app to see what is wrong.`,
  )
  if (opened.status === 'ok') opened.db.close()
  process.exit(0)
}

void main()
