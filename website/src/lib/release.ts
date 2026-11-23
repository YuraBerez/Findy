import { releaseFileUrl, releasePageUrl } from '../../../src/shared/project'
import type { Os } from './os'

/** The fields of a GitHub release that the website uses */
export interface ReleaseJson {
  tag_name: string
  assets: { name: string; size: number }[]
}

export type FileKind =
  | 'windowsInstaller'
  | 'windowsPortable'
  | 'macAppleSilicon'
  | 'macIntel'
  | 'linuxAppImage'
  | 'linuxDeb'
  | 'extensionChromium'
  | 'extensionFirefox'
  | 'checksums'

export interface ReleaseFile {
  kind: FileKind
  /** The system of a desktop build; null for the extension and the checksums */
  os: Os | null
  name: string
  url: string
  size: number
}

export interface Release {
  tag: string
  version: string
  pageUrl: string
  files: ReleaseFile[]
}

/** File names of a release (docs/release.md); the order is the order on the page */
const KINDS: { kind: FileKind; os: Os | null; name: RegExp }[] = [
  { kind: 'windowsInstaller', os: 'windows', name: /^Findy-Setup-.+\.exe$/ },
  { kind: 'windowsPortable', os: 'windows', name: /-Windows-portable\.zip$/ },
  { kind: 'macAppleSilicon', os: 'mac', name: /-macOS-Apple-Silicon\.dmg$/ },
  { kind: 'macIntel', os: 'mac', name: /-macOS-Intel\.dmg$/ },
  { kind: 'linuxAppImage', os: 'linux', name: /\.AppImage$/ },
  { kind: 'linuxDeb', os: 'linux', name: /_amd64\.deb$/ },
  { kind: 'extensionChromium', os: null, name: /-browser-extension\.zip$/ },
  { kind: 'extensionFirefox', os: null, name: /-browser-extension-Firefox\.zip$/ },
  { kind: 'checksums', os: null, name: /^SHA256SUMS\.txt$/ },
]

/** The builds that the main button offers for a system (FR-011) */
export const MAIN_KINDS: Record<Os, FileKind[]> = {
  windows: ['windowsInstaller'],
  mac: ['macAppleSilicon', 'macIntel'],
  linux: ['linuxAppImage', 'linuxDeb'],
}

/**
 * The download list of a release (FR-010, FR-012, FR-014). Only files that exist are
 * listed; unknown files are left out. A release with no desktop build is an error, so
 * the build fails and the old website stays.
 */
export function parseRelease(json: ReleaseJson): Release {
  const files = KINDS.flatMap(({ kind, os, name }) =>
    json.assets
      .filter((asset) => name.test(asset.name))
      .map((asset) => ({
        kind,
        os,
        name: asset.name,
        url: releaseFileUrl(json.tag_name, asset.name),
        size: asset.size,
      })),
  )
  if (!files.some((file) => file.os !== null)) {
    throw new Error(`Release ${json.tag_name} has no desktop build`)
  }
  return {
    tag: json.tag_name,
    version: json.tag_name.replace(/^v/, ''),
    pageUrl: releasePageUrl(json.tag_name),
    files,
  }
}

export const filesOf = (release: Release, kinds: FileKind[]): ReleaseFile[] =>
  kinds.flatMap((kind) => release.files.filter((file) => file.kind === kind))

export const filesForOs = (release: Release, os: Os): ReleaseFile[] =>
  release.files.filter((file) => file.os === os)
