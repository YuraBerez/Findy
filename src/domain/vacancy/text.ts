// Text helpers for page values (spec 009 FR-004): entities, tags, whitespace, limits.

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  laquo: '«',
  raquo: '»',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  middot: '·',
  bull: '•',
}

function decodeEntities(text: string): string {
  return text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, body: string) => {
    if (body[0] === '#') {
      const code =
        body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : Number(body.slice(1))
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? entity
  })
}

/** Entities decoded, tags removed, whitespace collapsed, cut to `limit`; `null` when empty. */
export function clean(value: unknown, limit: number): string | null {
  if (typeof value !== 'string') return null
  const text = decodeEntities(value.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return null
  const chars = Array.from(text) // never cut a character in half
  return chars.length > limit ? chars.slice(0, limit).join('').trimEnd() : text
}

/** Attributes of one start tag, names in lower case */
export function attributesOf(tag: string): Map<string, string> {
  const attributes = new Map<string, string>()
  for (const [, name, , double, single, bare] of tag.matchAll(
    /([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g,
  ))
    attributes.set(name!.toLowerCase(), double ?? single ?? bare ?? '')
  return attributes
}

/** The page without the parts a reader never sees: comments, scripts, styles, templates */
export function visibleHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|template)\b[\s\S]*?<\/\1\s*>/gi, ' ')
}

/**
 * The content of the element that `start` (an index of its start tag) opens, up to the
 * first end tag of the same name. Enough for short values such as a company name.
 */
export function elementContent(html: string, start: number): string | null {
  const open = /^<([a-z][\w-]*)\b[^>]*>/i.exec(html.slice(start))
  if (!open) return null
  const from = start + open[0].length
  const end = html.toLowerCase().indexOf(`</${open[1]!.toLowerCase()}`, from)
  return end < 0 ? null : html.slice(from, end)
}
