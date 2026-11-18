import { useCallback, useEffect, useState } from 'react'
import type { UpdateCheckResult, UpdateTrigger } from '@shared/ipc'

/**
 * Spec 006: the automatic check once at start (main decides if it is on and due), the
 * manual check, and the result to show. An automatic "up to date" shows nothing.
 * `check` must be stable (useAppState memoises it), or the automatic check repeats.
 */
export function useUpdateCheck(
  enabled: boolean,
  check: (trigger: UpdateTrigger) => Promise<UpdateCheckResult | null>,
) {
  const [result, setResult] = useState<UpdateCheckResult | null>(null)

  useEffect(() => {
    if (!enabled) return
    let live = true
    void check('auto').then((found) => {
      if (live && found?.status === 'available') setResult(found)
    })
    return () => {
      live = false
    }
  }, [enabled, check])

  const checkNow = useCallback(async () => {
    const found = await check('manual')
    if (found) setResult(found)
  }, [check])

  return { result, checkNow, dismiss: () => setResult(null) }
}
