import { useEffect, useState } from 'react'

const HOUR_MS = 60 * 60 * 1000

/** The current time, updated every `intervalMs` (spec 010 FR-004: at least once an hour) */
export function useNow(intervalMs = HOUR_MS): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])
  return now
}
