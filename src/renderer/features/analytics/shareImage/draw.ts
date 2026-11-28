import type { ShareCard } from './content'
import { FONT_FAMILY, LIGHT, LIGHT_CHART } from './palette'

/** FR-010: a square for a post */
export const IMAGE_SIZE = 1080

const PAD = 72
const GAP = 16

/** Width of `text` at a font size, in pixels */
export type Measure = (text: string, size: number) => number

/**
 * Plan D-4, FR-016: the largest size from `start` down to `min` at which `text` fits
 * `maxWidth`; `min` when nothing fits.
 */
export function fitFontSize(
  text: string,
  maxWidth: number,
  start: number,
  min: number,
  measure: Measure,
): number {
  for (let size = start; size > min; size--) {
    if (measure(text, size) <= maxWidth) return size
  }
  return min
}

/** `text`, or its start with "…" so that it fits `maxWidth` at `size` */
export function ellipsize(text: string, maxWidth: number, size: number, measure: Measure): string {
  if (measure(text, size) <= maxWidth) return text
  let end = text.length
  while (end > 0 && measure(`${text.slice(0, end).trimEnd()}…`, size) > maxWidth) end--
  return `${text.slice(0, end).trimEnd()}…`
}

/** Words of `text` in lines that fit `maxWidth` at `size`; a long word keeps its own line */
export function wrapWords(
  text: string,
  maxWidth: number,
  size: number,
  measure: Measure,
): string[] {
  const lines: string[] = []
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const last = lines.at(-1)
    if (last !== undefined && measure(`${last} ${word}`, size) <= maxWidth) {
      lines[lines.length - 1] = `${last} ${word}`
    } else {
      lines.push(word)
    }
  }
  return lines
}

/**
 * FR-016: a label in at most `maxLines` lines, at the largest size that fits; at `min`
 * the last line gets "…".
 */
export function fitLines(
  text: string,
  maxWidth: number,
  maxLines: number,
  start: number,
  min: number,
  measure: Measure,
): { size: number; lines: string[] } {
  for (let size = start; size >= min; size--) {
    const lines = wrapWords(text, maxWidth, size, measure)
    if (lines.length <= maxLines && lines.every((line) => measure(line, size) <= maxWidth)) {
      return { size, lines }
    }
  }
  const lines = wrapWords(text, maxWidth, min, measure)
  const kept = lines.slice(0, maxLines)
  const rest = lines.slice(maxLines - 1).join(' ')
  kept[kept.length - 1] = ellipsize(rest, maxWidth, min, measure)
  return { size: min, lines: kept }
}

const font = (size: number, bold = false) => `${bold ? 700 : 400} ${size}px ${FONT_FAMILY}`

/** FR-010, FR-011, FR-014: the card on a light 1080 × 1080 canvas */
export function drawShareCard(
  context: CanvasRenderingContext2D,
  card: ShareCard,
  logo: CanvasImageSource,
): void {
  const measureWith =
    (bold: boolean): Measure =>
    (text, size) => {
      context.font = font(size, bold)
      return context.measureText(text).width
    }
  const regular = measureWith(false)
  const bold = measureWith(true)
  const text = (
    value: string,
    x: number,
    y: number,
    size: number,
    color: string,
    isBold = false,
  ) => {
    context.font = font(size, isBold)
    context.fillStyle = color
    context.fillText(value, x, y)
  }
  const box = (
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    color: string,
  ) => {
    context.fillStyle = color
    context.beginPath()
    context.roundRect(x, y, width, height, radius)
    context.fill()
  }
  const right = IMAGE_SIZE - PAD
  const inner = IMAGE_SIZE - 2 * PAD

  context.textBaseline = 'alphabetic'
  context.textAlign = 'left'
  context.fillStyle = LIGHT.surface
  context.fillRect(0, 0, IMAGE_SIZE, IMAGE_SIZE)
  context.fillStyle = LIGHT.primary
  context.fillRect(0, 0, IMAGE_SIZE, 12)

  // Header: logo, "Findy", the subtitle; the period on the right
  context.drawImage(logo, PAD, 84, 96, 96)
  text(card.title, PAD + 120, 138, 64, LIGHT.fg, true)
  const subtitleSize = fitFontSize(card.subtitle, 380, 30, 20, regular)
  text(
    ellipsize(card.subtitle, 380, subtitleSize, regular),
    PAD + 120,
    178,
    subtitleSize,
    LIGHT['fg-muted'],
  )

  const periodSize = fitFontSize(card.period, 320, 28, 18, regular)
  const period = ellipsize(card.period, 320, periodSize, regular)
  const periodWidth = regular(period, periodSize) + 48
  box(right - periodWidth, 106, periodWidth, 56, 28, LIGHT.bg)
  text(period, right - periodWidth + 24, 134 + periodSize * 0.36, periodSize, LIGHT.fg)

  // Summary tiles, in the order of the screen
  const tileWidth = (inner - GAP * (card.tiles.length - 1)) / card.tiles.length
  const tileTop = 236
  card.tiles.forEach((tile, index) => {
    const x = PAD + index * (tileWidth + GAP)
    const width = tileWidth - 32
    box(x, tileTop, tileWidth, 180, 20, LIGHT.bg)
    const valueSize = fitFontSize(tile.value, width, 64, 28, bold)
    text(
      ellipsize(tile.value, width, valueSize, bold),
      x + 16,
      tileTop + 84,
      valueSize,
      LIGHT.fg,
      true,
    )
    const label = fitLines(tile.label, width, 2, 24, 16, regular)
    label.lines.forEach((line, row) => {
      text(line, x + 16, tileTop + 124 + row * label.size * 1.25, label.size, LIGHT['fg-muted'])
    })
  })

  // Funnel: stage, bar, "count (share)"
  text(card.funnelTitle, PAD, 500, 36, LIGHT.fg, true)
  const labelWidth = 300
  const valueWidth = 190
  const trackX = PAD + labelWidth + 20
  const trackWidth = right - valueWidth - 20 - trackX
  const rowHeight = Math.min(72, (936 - 548) / Math.max(card.funnel.length, 1))
  card.funnel.forEach((row, index) => {
    const middle = 548 + index * rowHeight + rowHeight / 2
    const labelSize = fitFontSize(row.label, labelWidth, 28, 18, regular)
    text(
      ellipsize(row.label, labelWidth, labelSize, regular),
      PAD,
      middle + labelSize * 0.36,
      labelSize,
      LIGHT.fg,
    )
    box(trackX, middle - 14, trackWidth, 28, 14, LIGHT.bg)
    if (row.ratio > 0) {
      box(trackX, middle - 14, Math.max(row.ratio * trackWidth, 28), 28, 14, LIGHT_CHART[row.stage])
    }
    const value = `${row.count} (${row.share})`
    const valueSize = fitFontSize(value, valueWidth, 28, 18, bold)
    context.textAlign = 'right'
    text(
      ellipsize(value, valueWidth, valueSize, bold),
      right,
      middle + valueSize * 0.36,
      valueSize,
      LIGHT.fg,
      true,
    )
    context.textAlign = 'left'
  })

  // Footer: the website address
  context.fillStyle = LIGHT.border
  context.fillRect(PAD, 964, inner, 2)
  context.textAlign = 'center'
  text(card.site, IMAGE_SIZE / 2, 1026, 28, LIGHT['fg-muted'])
  context.textAlign = 'left'
}

/** The image of `card` as PNG bytes for main, and as a `data:` URL for the preview (CSP) */
export async function renderShareImage(
  card: ShareCard,
  logoUrl: string,
): Promise<{ png: Uint8Array; url: string }> {
  const logo = new Image()
  logo.src = logoUrl
  await logo.decode()
  const canvas = document.createElement('canvas')
  canvas.width = IMAGE_SIZE
  canvas.height = IMAGE_SIZE
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D is not available')
  drawShareCard(context, card, logo)
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((value) => (value ? resolve(value) : reject(new Error('No PNG'))), 'image/png'),
  )
  return { png: new Uint8Array(await blob.arrayBuffer()), url: canvas.toDataURL('image/png') }
}
