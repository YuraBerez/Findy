// Launches the unpacked build from `npm run dist:dir` with FINDY_SMOKE_TEST=1
// and checks that it can load native dependencies (architecture D-2). Then starts
// the MCP server from app.asar in Node mode and checks that it answers (spec 004), and the
// browser connector through a launcher as the app writes it (spec 019 FR-011, FR-012).
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs'
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

// macOS: a broken bundle signature makes a downloaded app "damaged" on Apple
// Silicon, with no way to open it (electron-builder.yml → mac.identity)
if (process.platform === 'darwin') {
  const app = join(dirname(executable), '..', '..')
  const verify = spawnSync('codesign', ['--verify', '--deep', '--strict', app], {
    encoding: 'utf8',
  })
  if (verify.status !== 0) {
    console.error(`Code signature is not valid:\n${verify.stderr}`)
    process.exit(1)
  }
  console.log('Code signature valid (ad hoc)')
}

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

// Spec 019: the browser starts this launcher (the text of src/main/connector/register/launcher.ts)
const connectorScript = join(resources, 'app.asar', 'out', 'main', 'connector.js')
const smokeData = mkdtempSync(join(tmpdir(), 'findy-smoke-connector-'))
const launcher =
  process.platform === 'win32'
    ? join(smokeData, 'findy-connector.cmd')
    : join(smokeData, 'findy-connector.sh')
writeFileSync(
  launcher,
  process.platform === 'win32'
    ? [
        '@echo off',
        'set ELECTRON_RUN_AS_NODE=1',
        `set "FINDY_USER_DATA_DIR=${smokeData}"`,
        `"${executable}" "${connectorScript}"`,
        '',
      ].join('\r\n')
    : [
        '#!/bin/sh',
        `export FINDY_USER_DATA_DIR="${smokeData}"`,
        `ELECTRON_RUN_AS_NODE=1 exec "${executable}" "${connectorScript}"`,
        '',
      ].join('\n'),
  { mode: 0o755 },
)
const frame = (value) => {
  const body = Buffer.from(JSON.stringify(value), 'utf8')
  const header = Buffer.alloc(4)
  header.writeUInt32LE(body.length, 0)
  return Buffer.concat([header, body])
}
for (const [request, expected] of [
  [{ type: 'hello' }, '"protocol":1'],
  [
    { type: 'add', title: 'Smoke', company: 'Findy', url: 'https://example.com/1' },
    '"stage":"applied"',
  ],
]) {
  const connector = spawnSync(launcher, [], {
    // A .cmd file runs only through the shell, as Chrome starts it
    shell: process.platform === 'win32',
    input: frame(request),
    timeout: 60_000,
  })
  const answer = connector.stdout?.subarray(4).toString('utf8') ?? ''
  if (connector.status !== 0 || !answer.includes(expected)) {
    process.stdout.write(answer)
    process.stderr.write(connector.stderr ?? '')
    console.error(`Connector smoke test failed on ${request.type} (exit code ${connector.status})`)
    process.exit(1)
  }
}
console.log(
  'Connector smoke test passed: the launcher starts the connector, which answers and adds',
)
