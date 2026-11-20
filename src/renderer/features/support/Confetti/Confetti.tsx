import { useEffect, useRef, useState } from 'react'
import styles from './Confetti.module.css'

const DURATION_MS = 3000
const PIECES = 150
// The stage colours of the charts, so the confetti matches the theme
const COLOR_TOKENS = [
  '--chart-applied',
  '--chart-hr_interview',
  '--chart-test_task',
  '--chart-technical_interview',
  '--chart-c_level_interview',
  '--chart-offered',
]

interface Piece {
  x: number
  y: number
  /** Fall speed, pixels per millisecond */
  speed: number
  /** Side-to-side sway: amplitude and phase */
  sway: number
  phase: number
  size: number
  angle: number
  spin: number
  color: string
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Spec 013 US-3: confetti over the window for a few seconds after a move to Offer.
 * It takes no input and is hidden from assistive technology (FR-011); with reduced
 * motion it is not drawn at all (FR-012). Mount it again (a new key) to play again.
 */
export function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [playing, setPlaying] = useState(() => !reducedMotion())

  useEffect(() => {
    const canvas = ref.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    // The top layer, so it is over a modal <dialog> that opens with it
    canvas.showPopover()
    const width = window.innerWidth
    const height = window.innerHeight
    // Sharp on high-density screens
    const scale = window.devicePixelRatio || 1
    canvas.width = width * scale
    canvas.height = height * scale
    context.scale(scale, scale)
    const style = getComputedStyle(document.documentElement)
    const colors = COLOR_TOKENS.map((token) => style.getPropertyValue(token).trim())
    // A shower over the whole width, starting above the window, falling for the whole time
    const pieces: Piece[] = Array.from({ length: PIECES }, (_, index) => ({
      x: Math.random() * width,
      y: -Math.random() * height * 0.5,
      // One window height in 1.8–3 s, the same on any frame rate
      speed: height / (1800 + Math.random() * 1200),
      sway: 0.6 + Math.random() * 1.2,
      phase: Math.random() * Math.PI * 2,
      size: 7 + Math.random() * 6,
      angle: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.2,
      color: colors[index % colors.length]!,
    }))
    const start = performance.now()
    let frame = 0
    let last = start
    const draw = (now: number) => {
      const elapsed = now - start
      const step = now - last
      last = now
      context.clearRect(0, 0, width, height)
      // Fade out in the last quarter
      context.globalAlpha = Math.max(0, Math.min(1, (DURATION_MS - elapsed) / (DURATION_MS / 4)))
      for (const piece of pieces) {
        piece.y += piece.speed * step
        piece.x += Math.sin(piece.phase + elapsed / 300) * piece.sway * (step / 16)
        piece.angle += piece.spin * (step / 16)
        context.save()
        context.translate(piece.x, piece.y)
        context.rotate(piece.angle)
        context.fillStyle = piece.color
        context.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2)
        context.restore()
      }
      if (elapsed < DURATION_MS) frame = requestAnimationFrame(draw)
      else setPlaying(false)
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [])

  if (!playing) return null
  return (
    <canvas
      ref={ref}
      popover="manual"
      className={styles.confetti}
      aria-hidden="true"
      data-testid="confetti"
    />
  )
}
