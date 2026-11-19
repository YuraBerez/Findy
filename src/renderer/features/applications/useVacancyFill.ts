import { useEffect, useRef, useState } from 'react'
import { isHttpUrl } from '@domain/limits'
import type { VacancyData } from '@shared/ipc'

export type VacancyStatus = 'idle' | 'reading' | 'filled' | 'notFound'

/**
 * Spec 009: reads a pasted vacancy link and fills the form. Only the answer to the
 * latest read counts: a new read, a changed link or a closed dialog makes older
 * answers stale (FR-007).
 */
export function useVacancyFill(
  read: (url: string) => Promise<VacancyData | null>,
  fill: (data: VacancyData) => void,
) {
  const [status, setStatus] = useState<VacancyStatus>('idle')
  const request = useRef(0)
  useEffect(
    () => () => {
      request.current++ // closed: ignore the answer
    },
    [],
  )

  const start = async (url: string) => {
    const link = url.trim()
    if (!isHttpUrl(link)) return
    const id = ++request.current
    setStatus('reading')
    const data = await read(link)
    if (id !== request.current) return
    if (data) fill(data)
    setStatus(data ? 'filled' : 'notFound')
  }

  /** The link changed: forget the current read and its message */
  const reset = () => {
    request.current++
    setStatus('idle')
  }

  return { status, start, reset }
}
