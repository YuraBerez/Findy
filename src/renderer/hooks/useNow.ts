import { useEffect, useState } from 'react'

const HOUR_MS = 60 * 60 * 1000

/**
 * The current time. It updates at the moment that `next` gives (spec 015 FR-023: a step
 * mark changes), and at least once an hour (spec 010 FR-004).
 */
export function useNow(next?: (now: Date) => Date): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const at = next?.(now).getTime() ?? Infinity
    // A small margin, so that the new time is past the moment
    const delay = Math.min(HOUR_MS, Math.max(1000, at - now.getTime() + 50))
    const timer = setTimeout(() => setNow(new Date()), delay)
    return () => clearTimeout(timer)
  }, [now, next])
  return now
}
