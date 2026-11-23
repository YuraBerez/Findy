import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

// Spec 020 plan D-5: the checks that a pull request runs
const run = (...files: string[]) =>
  execFileSync('node', ['scripts/ci-changes.mjs'], { input: files.join('\n'), encoding: 'utf8' })

const result = (desktop: boolean, website: boolean) => `desktop=${desktop}\nwebsite=${website}\n`

describe('CI checks by changed files', () => {
  it('runs only the desktop checks for app code and its config', () => {
    for (const file of [
      'src/main/ipc.ts',
      'e2e/specs/board.spec.ts',
      'tests/unit/db.test.ts',
      'locales/uk.json',
      'skills/findy/SKILL.md',
      'package-lock.json',
      'tsconfig.web.json',
      'electron-builder.yml',
      'build/icon.png',
    ]) {
      expect(run(file), file).toBe(result(true, false))
    }
  })

  it('runs only the website checks for the website and the files it shows', () => {
    for (const file of [
      'website/src/lib/os.ts',
      'website/package-lock.json',
      'docs/guide/install.uk.md',
      'docs/screenshots/board-en.png',
      '.github/workflows/site.yml',
    ]) {
      expect(run(file), file).toBe(result(false, true))
    }
  })

  it('runs both for files of both and for the CI itself', () => {
    expect(run('src/shared/project.ts')).toBe(result(true, true))
    expect(run('assets/logo.svg')).toBe(result(true, true))
    expect(run('.github/workflows/ci.yml')).toBe(result(true, true))
    expect(run('scripts/ci-changes.mjs')).toBe(result(true, true))
    expect(run('src/main/ipc.ts', 'website/src/pages/index.astro')).toBe(result(true, true))
  })

  it('runs nothing for documentation and specs', () => {
    expect(
      run(
        'README.md',
        'docs/architecture.md',
        'specs/020-website/spec.md',
        'CHANGELOG.md',
        '.claude/skills/learn/SKILL.md',
        '.github/pull_request_template.md',
        '.github/release-downloads.md',
        '.github/workflows/release.yml',
      ),
    ).toBe(result(false, false))
  })
})
