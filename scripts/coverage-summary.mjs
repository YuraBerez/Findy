// Prints coverage/coverage-summary.json as a Markdown table (for the CI job summary).
import { existsSync, readFileSync } from 'node:fs'

const file = 'coverage/coverage-summary.json'
if (!existsSync(file)) {
  console.log('### Coverage\n\nNo coverage report was produced.')
  process.exit(0)
}

const { total } = JSON.parse(readFileSync(file, 'utf8'))
const THRESHOLD = 80
const rows = ['lines', 'branches', 'functions', 'statements'].map((key) => {
  const { pct, covered, total: all } = total[key]
  const status = all === 0 || pct >= THRESHOLD ? '✅' : '❌'
  return `| ${key} | ${pct}% | ${covered}/${all} | ${status} |`
})

console.log(
  [
    `### Coverage (threshold ${THRESHOLD}%)`,
    '',
    '| Metric | Coverage | Covered | Status |',
    '|--------|----------|---------|--------|',
    ...rows,
  ].join('\n'),
)
