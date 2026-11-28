import type { ShareCard } from './content'
import { FONT_FAMILY, LIGHT } from './palette'

/** FR-010: a square for a post */
export const IMAGE_SIZE = 1080

const PAD = 80
const GAP = 16
const RIGHT = IMAGE_SIZE - PAD
const INNER = IMAGE_SIZE - 2 * PAD

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

type Weight = 400 | 600

/** A text style: size, weight and letter spacing in pixels */
interface Style {
  size: number
  weight: Weight
  spacing?: number
}

/** FR-010, FR-011, FR-014: the card on a light 1080 × 1080 canvas */
export function drawShareCard(
  context: CanvasRenderingContext2D,
  card: ShareCard,
  logo: CanvasImageSource,
): void {
  const setStyle = ({ size, weight, spacing = 0 }: Style) => {
    context.font = `${weight} ${size}px ${FONT_FAMILY}`
    context.letterSpacing = `${spacing}px`
  }
  const measureWith =
    (weight: Weight, spacing = 0): Measure =>
    (value, size) => {
      setStyle({ size, weight, spacing })
      return context.measureText(value).width
    }
  const text = (
    value: string,
    x: number,
    y: number,
    style: Style,
    color: string,
    align: CanvasTextAlign = 'left',
  ) => {
    setStyle(style)
    context.textAlign = align
    context.fillStyle = color
    context.fillText(value, x, y)
  }
  /** A line of text that fits `width`: smaller first, then cut with "…" */
  const fitted = (
    value: string,
    x: number,
    y: number,
    width: number,
    { size, weight, spacing }: Style,
    min: number,
    color: string,
    align: CanvasTextAlign = 'left',
  ) => {
    const measure = measureWith(weight, spacing)
    const fitSize = fitFontSize(value, width, size, min, measure)
    const style = { size: fitSize, weight, spacing }
    text(ellipsize(value, width, fitSize, measure), x, y, style, color, align)
  }
  const rule = (y: number) => {
    context.fillStyle = LIGHT.border
    context.fillRect(PAD, y, INNER, 2)
  }
  /** Small capitals for the section and tile names */
  const caption: Style = { size: 18, weight: 600, spacing: 1.5 }
  const upper = (value: string) => value.toLocaleUpperCase()

  context.textBaseline = 'alphabetic'
  context.fillStyle = LIGHT.surface
  context.fillRect(0, 0, IMAGE_SIZE, IMAGE_SIZE)

  // Header: logo, "Findy" and the subtitle; the period on the right
  context.drawImage(logo, PAD, 80, 72, 72)
  text(card.title, PAD + 96, 112, { size: 40, weight: 600, spacing: -0.5 }, LIGHT.fg)
  fitted(card.subtitle, PAD + 96, 146, 420, { size: 24, weight: 400 }, 18, LIGHT['fg-muted'])
  fitted(upper(card.period), RIGHT, 112, 340, caption, 14, LIGHT['fg-muted'], 'right')
  rule(192)

  // Summary tiles, in the order of the screen: the name above, the number below
  const tileWidth = (INNER - GAP * (card.tiles.length - 1)) / card.tiles.length
  const tileTop = 232
  const labelMeasure = measureWith(caption.weight, caption.spacing)
  card.tiles.forEach((tile, index) => {
    const x = PAD + index * (tileWidth + GAP)
    const width = tileWidth - 40
    context.strokeStyle = LIGHT.border
    context.lineWidth = 2
    context.beginPath()
    context.roundRect(x + 1, tileTop + 1, tileWidth - 2, 168, 12)
    context.stroke()
    const label = fitLines(upper(tile.label), width, 2, caption.size, 13, labelMeasure)
    label.lines.forEach((line, row) => {
      const style = { ...caption, size: label.size }
      text(line, x + 20, tileTop + 44 + row * label.size * 1.3, style, LIGHT['fg-muted'])
    })
    fitted(
      tile.value,
      x + 20,
      tileTop + 144,
      width,
      { size: 56, weight: 600, spacing: -1 },
      28,
      LIGHT.fg,
    )
  })

  // Funnel: stage, bar, number and share
  text(upper(card.funnelTitle), PAD, 476, caption, LIGHT['fg-muted'])
  const labelWidth = 300
  const shareX = RIGHT
  const countX = RIGHT - 110
  const trackX = PAD + labelWidth + 24
  const trackWidth = countX - 90 - trackX
  const rowHeight = Math.min(64, (936 - 500) / Math.max(card.funnel.length, 1))
  card.funnel.forEach((row, index) => {
    const middle = 500 + index * rowHeight + rowHeight / 2
    const baseline = middle + 9
    fitted(row.label, PAD, baseline, labelWidth, { size: 26, weight: 400 }, 18, LIGHT.fg)
    context.fillStyle = LIGHT.bg
    context.beginPath()
    context.roundRect(trackX, middle - 6, trackWidth, 12, 6)
    context.fill()
    if (row.ratio > 0) {
      context.fillStyle = LIGHT.primary
      context.beginPath()
      context.roundRect(trackX, middle - 6, Math.max(row.ratio * trackWidth, 12), 12, 6)
      context.fill()
    }
    fitted(row.count, countX, baseline, 80, { size: 26, weight: 600 }, 18, LIGHT.fg, 'right')
    fitted(
      row.share,
      shareX,
      baseline,
      96,
      { size: 22, weight: 400 },
      16,
      LIGHT['fg-muted'],
      'right',
    )
  })

  // Footer: the website address
  rule(960)
  text(card.site, PAD, 1016, { size: 22, weight: 400 }, LIGHT['fg-muted'])
  context.textAlign = 'left'
  context.letterSpacing = '0px'
}

/** The logo, loaded once. `onload` and not `decode()`: Chromium can refuse to decode an SVG
 * without width and height (the logo has only a viewBox), seen on Windows CI. */
const logos = new Map<string, Promise<HTMLImageElement>>()

function loadLogo(url: string): Promise<HTMLImageElement> {
  let logo = logos.get(url)
  if (!logo) {
    logo = new Promise((resolve, reject) => {
      const image = new Image(96, 96)
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('The logo cannot be loaded'))
      image.src = url
    })
    // A failed load is tried again on the next click
    logo.catch(() => logos.delete(url))
    logos.set(url, logo)
  }
  return logo
}

/** A `data:` URL of the PNG bytes, without a second encoding of the canvas */
export function pngDataUrl(png: Uint8Array): string {
  let binary = ''
  for (let start = 0; start < png.length; start += 0x8000) {
    binary += String.fromCharCode(...png.subarray(start, start + 0x8000))
  }
  return `data:image/png;base64,${btoa(binary)}`
}

/** The image of `card` as PNG bytes for main, and as a `data:` URL for the preview (CSP) */
export async function renderShareImage(
  card: ShareCard,
  logoUrl: string,
): Promise<{ png: Uint8Array; url: string }> {
  const logo = await loadLogo(logoUrl)
  const canvas = document.createElement('canvas')
  canvas.width = IMAGE_SIZE
  canvas.height = IMAGE_SIZE
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D is not available')
  drawShareCard(context, card, logo)
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((value) => (value ? resolve(value) : reject(new Error('No PNG'))), 'image/png'),
  )
  const png = new Uint8Array(await blob.arrayBuffer())
  return { png, url: pngDataUrl(png) }
}
