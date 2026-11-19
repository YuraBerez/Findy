// Spec 011 FR-022: where a site declares its icon, and which images Findy accepts.
import { isHttpUrl } from '../limits'

export const ICON_LIMITS = { maxBytes: 100 * 1024 } as const

export type IconMime = 'image/png' | 'image/x-icon' | 'image/jpeg' | 'image/gif' | 'image/webp'

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) =>
  signature.every((byte, index) => bytes[offset + index] === byte)

/**
 * The image type from the first bytes (plan D-4); `null` for anything else, SVG too:
 * servers often send icons with a wrong Content-Type, and SVG can hold scripts.
 */
export function sniffImage(bytes: Uint8Array): IconMime | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png'
  if (startsWith(bytes, [0x00, 0x00, 0x01, 0x00])) return 'image/x-icon'
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg'
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38])) return 'image/gif'
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8))
    return 'image/webp'
  return null
}

const ATTRIBUTE = /([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g

/**
 * The icon that the home page declares (`<link rel="icon">`, `shortcut icon`,
 * `apple-touch-icon`), as an absolute `http`/`https` address; SVG icons are skipped.
 * `null` when there is none: then the host's `/favicon.ico` is tried.
 */
export function declaredIcon(html: string, pageUrl: string): string | null {
  for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
    const attributes = new Map<string, string>()
    for (const [, name, , double, single, bare] of tag.matchAll(ATTRIBUTE))
      attributes.set(name!.toLowerCase(), double ?? single ?? bare ?? '')
    const rel = (attributes.get('rel') ?? '').toLowerCase().split(/\s+/)
    if (!rel.includes('icon') && !rel.includes('apple-touch-icon')) continue
    const href = attributes.get('href')
    if (!href || /svg/i.test(attributes.get('type') ?? '') || /\.svg(\?|#|$)/i.test(href)) continue
    let url: string
    try {
      url = new URL(href, pageUrl).href
    } catch {
      continue
    }
    if (isHttpUrl(url)) return url
  }
  return null
}
