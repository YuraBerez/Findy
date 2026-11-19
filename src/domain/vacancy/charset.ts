// Spec 009 edge case: a page that is not UTF-8 but names its encoding.

/** Bytes searched for `<meta charset>`, as in the HTML standard's prescan */
const PRESCAN_BYTES = 1024

const META_CHARSET =
  /<meta\b[^>]*?\bcharset\s*=\s*["']?\s*([\w.:-]+)|<meta\b[^>]*?\bcontent\s*=\s*["'][^"']*charset\s*=\s*([\w.:-]+)/i

/** The charset label from the `Content-Type` header, else from `<meta>`; `utf-8` when none. */
export function charsetOf(contentType: string | null, bytes: Uint8Array): string {
  const fromHeader = /charset\s*=\s*["']?([\w.:-]+)/i.exec(contentType ?? '')?.[1]
  if (fromHeader) return fromHeader.toLowerCase()
  // Latin-1 maps every byte to one character, so ASCII tags read right in any encoding
  const head = new TextDecoder('latin1').decode(bytes.subarray(0, PRESCAN_BYTES))
  const match = META_CHARSET.exec(head)
  return (match?.[1] ?? match?.[2] ?? 'utf-8').toLowerCase()
}

/** The page text; an unknown charset label reads as UTF-8. */
export function decodePage(bytes: Uint8Array, contentType: string | null): string {
  try {
    return new TextDecoder(charsetOf(contentType, bytes)).decode(bytes)
  } catch {
    return new TextDecoder('utf-8').decode(bytes)
  }
}
