// Launches the unpacked build from `npm run dist:dir` with FINDY_SMOKE_TEST=1
// and checks that it can load native dependencies (architecture D-2). Then starts
// the MCP server from app.asar in Node mode and checks that it answers (spec 004).
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

const candidates = {
  darwin: ['mac-arm64', 'mac', 'mac-universal'].map((dir) =>
    join('dist', dir, 'Findy.app', 'Contents', 'MacOS', 'Findy'),
  ),
  win32: [join('dist', 'win-unpacked', 'Findy.exe')],
  linux: [join('dist', 'linux-unpacked', 'findy')],
}[process.platform]

const executable = candidates?.find((path) => existsSync(path))
if (!executable) {
  console.error(`No unpacked build found. Looked in:\n  ${candidates?.join('\n  ')}`)
  process.exit(1)
}

const args = process.platform === 'linux' ? ['--no-sandbox'] : []
const result = spawnSync(executable, args, {
  env: { ...process.env, FINDY_SMOKE_TEST: '1' },
  encoding: 'utf8',
  timeout: 60_000,
})

process.stdout.write(result.stdout ?? '')
process.stderr.write(result.stderr ?? '')

if (result.status !== 0 || !result.stdout?.includes('FINDY_SMOKE_OK')) {
  console.error(`Smoke test failed (exit code ${result.status})`)
  process.exit(1)
}
console.log(`Smoke test passed: ${executable}`)

// Same command as the app shows the user (architecture D-8)
const resources =
  process.platform === 'darwin'
    ? join(dirname(executable), '..', 'Resources')
    : join(dirname(executable), 'resources')
const initialize = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'smoke', version: '1' },
  },
}
const mcp = spawnSync(executable, [join(resources, 'app.asar', 'out', 'main', 'mcp.js')], {
  env: {
    ...process.env,
    ELECTRON_RUN_AS_NODE: '1',
    FINDY_USER_DATA_DIR: mkdtempSync(join(tmpdir(), 'findy-smoke-')),
  },
  input: JSON.stringify(initialize) + '\n', // stdin closes after it: the server must exit
  encoding: 'utf8',
  timeout: 60_000,
})
if (mcp.status !== 0 || !mcp.stdout?.includes('"name":"findy"')) {
  process.stdout.write(mcp.stdout ?? '')
  process.stderr.write(mcp.stderr ?? '')
  console.error(`MCP smoke test failed (exit code ${mcp.status})`)
  process.exit(1)
}
console.log('MCP smoke test passed: the server answers in Node mode and exits')
