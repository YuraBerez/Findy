import { useCallback, useEffect, useRef, useState } from 'react'
import type { UpdateCheckResult, UpdateTrigger } from '@shared/ipc'

/**
 * Spec 006: the automatic check once at start (main decides if it is on and due), the
 * manual check, and the result to show. An automatic "up to date" shows nothing.
 */
export function useUpdateCheck(
  enabled: boolean,
  check: (trigger: UpdateTrigger) => Promise<UpdateCheckResult | null>,
) {
  const [result, setResult] = useState<UpdateCheckResult | null>(null)
  // Once per start: `check` changes with the language, and StrictMode runs effects twice
  const started = useRef(false)

  useEffect(() => {
    if (!enabled || started.current) return
    started.current = true
    void check('auto').then((found) => {
      if (found?.status === 'available') setResult(found)
    })
  }, [enabled, check])

  const checkNow = useCallback(async () => {
    const found = await check('manual')
    if (found) setResult(found)
  }, [check])

  return { result, checkNow, dismiss: () => setResult(null) }
}
