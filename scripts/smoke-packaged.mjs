// Launches the unpacked build from `npm run dist:dir` with FINDY_SMOKE_TEST=1
// and checks that it can load native dependencies (architecture D-2).
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

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
