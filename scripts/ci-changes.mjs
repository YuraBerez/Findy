// Spec 020 plan D-5: which CI checks a pull request needs, from its changed files.
// Reads file paths (one per line) on stdin, prints `desktop=true|false` and
// `website=true|false` for $GITHUB_OUTPUT. A file that matches neither list (docs, specs,
// README, templates) runs no checks.
import { readFileSync } from 'node:fs'

/** The CI itself: a change runs every check */
const CI = /^(\.github\/workflows\/ci\.yml|scripts\/ci-changes\.mjs)$/

/** Code and config of the desktop app, and the files that its build or tests read */
const DESKTOP = new RegExp(
  '^(' +
    [
      'src/',
      'e2e/',
      'tests/',
      'scripts/',
      'build/',
      'locales/',
      'skills/',
      'assets/',
      'package(-lock)?\\.json$',
      'tsconfig[^/]*\\.json$',
      'electron\\.vite\\.config\\.ts$',
      'electron-builder\\.yml$',
      'vitest\\.config\\.mts$',
      'playwright\\.config\\.ts$',
      'eslint\\.config\\.mjs$',
      '\\.prettierrc\\.json$',
      '\\.prettierignore$',
      '\\.editorconfig$',
    ].join('|') +
    ')',
)

/** The website package and the repository files that the website shows */
const WEBSITE =
  /^(website\/|docs\/guide\/|docs\/screenshots\/|assets\/logo\.svg$|src\/shared\/project\.ts$|\.github\/workflows\/site\.yml$)/

export function changes(files) {
  const any = (pattern) => files.some((file) => pattern.test(file))
  const ci = any(CI)
  return { desktop: ci || any(DESKTOP), website: ci || any(WEBSITE) }
}

const files = readFileSync(0, 'utf8').split('\n').filter(Boolean)
const { desktop, website } = changes(files)
console.log(`desktop=${desktop}\nwebsite=${website}`)
