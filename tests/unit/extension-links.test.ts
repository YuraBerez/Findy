import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { extensionFileName, extensionFileUrl, extensionGuideUrl } from '../../src/shared/extension'
import { PROJECT_URL, SITE_URL } from '../../src/shared/project'

const root = join(__dirname, '../..')

describe('browser extension links (spec 024)', () => {
  it('names the files as the release workflow does (FR-003, plan D-1)', () => {
    const workflow = readFileSync(join(root, '.github/workflows/release.yml'), 'utf8')
    // release.yml writes `Findy-${TAG#v}-…`; the app writes the version without the "v"
    for (const build of ['chromium', 'firefox'] as const) {
      const name = extensionFileName('VERSION', build).replace('VERSION', '${TAG#v}')
      expect(workflow, build).toContain(`/dist/${name}"`)
    }
  })

  it('links the files of the release of the version (FR-003)', () => {
    expect(extensionFileUrl('0.8.0', 'chromium')).toBe(
      `${PROJECT_URL}/releases/download/v0.8.0/Findy-0.8.0-browser-extension.zip`,
    )
    expect(extensionFileUrl('0.8.0', 'firefox')).toBe(
      `${PROJECT_URL}/releases/download/v0.8.0/Findy-0.8.0-browser-extension-Firefox.zip`,
    )
  })

  it('links the guide in the app language, and the guide exists in both (FR-004, plan D-2)', () => {
    expect(extensionGuideUrl('en')).toBe(`${SITE_URL}guide/browser-extension/`)
    expect(extensionGuideUrl('uk')).toBe(`${SITE_URL}uk/guide/browser-extension/`)
    expect(extensionGuideUrl('pl')).toBe(`${SITE_URL}pl/guide/browser-extension/`)
    for (const file of [
      'browser-extension.md',
      'browser-extension.uk.md',
      'browser-extension.pl.md',
    ]) {
      expect(existsSync(join(root, 'docs/guide', file)), file).toBe(true)
    }
  })
})
