import { describe, expect, it } from 'vitest'
import { PROJECT_URL } from '../../../src/shared/project'
import {
  MAIN_KINDS,
  filesForOs,
  filesOf,
  parseRelease,
  type ReleaseJson,
} from '../../src/lib/release'

const NAMES = [
  'Findy-0.7.0-browser-extension-Firefox.zip',
  'Findy-0.7.0-browser-extension.zip',
  'Findy-0.7.0-macOS-Apple-Silicon.dmg',
  'Findy-0.7.0-macOS-Intel.dmg',
  'Findy-0.7.0-Windows-portable.zip',
  'Findy-0.7.0.AppImage',
  'Findy-Setup-0.7.0.exe',
  'findy_0.7.0_amd64.deb',
  'SHA256SUMS.txt',
  'something-else.blockmap',
]

const json = (names: string[]): ReleaseJson => ({
  tag_name: 'v0.7.0',
  assets: names.map((name, i) => ({ name, size: 1000 * (i + 1) })),
})

describe('release files (spec 020 FR-010, FR-012, FR-014)', () => {
  it('gives the version, the release page and a link to each known file', () => {
    const release = parseRelease(json(NAMES))
    expect(release.version).toBe('0.7.0')
    expect(release.pageUrl).toBe(`${PROJECT_URL}/releases/tag/v0.7.0`)
    expect(release.files.map((f) => f.kind)).toEqual([
      'windowsInstaller',
      'windowsPortable',
      'macAppleSilicon',
      'macIntel',
      'linuxAppImage',
      'linuxDeb',
      'extensionChromium',
      'extensionFirefox',
      'checksums',
    ])
    for (const file of release.files) {
      expect(file.url).toBe(`${PROJECT_URL}/releases/download/v0.7.0/${file.name}`)
    }
  })

  it('gives the main builds for each system', () => {
    const release = parseRelease(json(NAMES))
    expect(filesOf(release, MAIN_KINDS.windows).map((f) => f.name)).toEqual([
      'Findy-Setup-0.7.0.exe',
    ])
    expect(filesOf(release, MAIN_KINDS.mac)).toHaveLength(2)
    expect(filesOf(release, MAIN_KINDS.linux)).toHaveLength(2)
    expect(filesForOs(release, 'windows')).toHaveLength(2)
  })

  it('lists only the files of a partial release', () => {
    const release = parseRelease(json(['Findy-Setup-0.7.0.exe', 'Findy-0.7.0.AppImage']))
    expect(filesOf(release, MAIN_KINDS.mac)).toEqual([])
    expect(filesOf(release, MAIN_KINDS.linux).map((f) => f.kind)).toEqual(['linuxAppImage'])
  })

  it('fails for a release with no desktop build', () => {
    expect(() => parseRelease(json(['SHA256SUMS.txt']))).toThrow(/no desktop build/)
  })
})
