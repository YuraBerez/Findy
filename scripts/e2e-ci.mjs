// CI flaky policy (docs/release.md → CI): run the e2e suite; at the end, run only the
// failed tests once more. Passed on the rerun → flaky: a warning in the PR and the
// job summary, the job stays green. Failed again → a real failure, the job is red.
import { spawnSync } from 'node:child_process'
import { appendFileSync, existsSync, readFileSync } from 'node:fs'

const RERUN_REPORT = 'test-results/rerun.json'

const playwright = (args, env = {}) =>
  spawnSync('npx', ['playwright', 'test', ...args], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, ...env },
  }).status ?? 1

const first = playwright([])
if (first === 0) process.exit(0)

const lastRun = 'test-results/.last-run.json'
const failed = existsSync(lastRun)
  ? (JSON.parse(readFileSync(lastRun, 'utf8')).failedTests ?? [])
  : []
if (failed.length === 0) process.exit(first) // the run broke before tests, nothing to rerun

console.log(`\n${failed.length} test(s) failed. Running them once more (flaky policy).\n`)
const rerun = playwright(['--last-failed', '--reporter=list,json'], {
  PLAYWRIGHT_JSON_OUTPUT_NAME: RERUN_REPORT,
})

/** Full titles and outcomes of the rerun */
function results() {
  if (!existsSync(RERUN_REPORT)) return []
  const out = []
  const walk = (suite, path) => {
    const here = suite.title && !suite.title.endsWith('.ts') ? [...path, suite.title] : path
    for (const spec of suite.specs ?? [])
      for (const test of spec.tests)
        out.push({
          title: `${spec.file} › ${[...here, spec.title].join(' › ')}`,
          ok: test.status === 'expected',
        })
    for (const child of suite.suites ?? []) walk(child, here)
  }
  for (const suite of JSON.parse(readFileSync(RERUN_REPORT, 'utf8')).suites) walk(suite, [])
  return out
}

const all = results()
const flaky = all.filter((test) => test.ok)
const broken = all.filter((test) => !test.ok)
const summary = [`### E2E on ${process.platform}`, '']
if (flaky.length) {
  summary.push(`⚠️ **Flaky** (failed, then passed on the rerun): fix or quarantine these.`, '')
  for (const test of flaky) {
    summary.push(`- ${test.title}`)
    console.log(`::warning title=Flaky e2e test (${process.platform})::${test.title}`)
  }
}
if (broken.length) {
  summary.push('', '❌ **Failed twice:**', '')
  for (const test of broken) summary.push(`- ${test.title}`)
}
if (process.env.GITHUB_STEP_SUMMARY)
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary.join('\n') + '\n')
console.log(summary.join('\n'))
process.exit(rerun)
