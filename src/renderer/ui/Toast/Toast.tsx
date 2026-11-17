import { useEffect, useState } from 'react'
import { IconButton } from '../IconButton'
import { CloseIcon } from '../icons'
import styles from './Toast.module.css'

export interface ToastMessage {
  id: number
  text: string
}

interface ViewportProps {
  toasts: ToastMessage[]
  closeLabel: string
  /** Keep it stable (useCallback): a new function would restart every timer */
  onDismiss(id: number): void
}

const LIFETIME_MS = 8_000

/** Error notifications, bottom-right, newest on top (spec 003 FR-007). */
export function ToastViewport({ toasts, closeLabel, onDismiss }: ViewportProps) {
  return (
    <div className={styles.viewport}>
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} closeLabel={closeLabel} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function Toast({
  toast,
  closeLabel,
  onDismiss,
}: { toast: ToastMessage } & Omit<ViewportProps, 'toasts'>) {
  const [paused, setPaused] = useState(false)

  // Closes by itself, but never while the user reads it (hover or focus)
  useEffect(() => {
    if (paused) return
    const timer = setTimeout(() => onDismiss(toast.id), LIFETIME_MS)
    return () => clearTimeout(timer)
  }, [paused, onDismiss, toast.id])

  return (
    <div
      role="alert"
      className={styles.toast}
      data-testid="toast"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <p className={styles.text}>{toast.text}</p>
      <IconButton
        label={closeLabel}
        icon={<CloseIcon size={16} />}
        onClick={() => onDismiss(toast.id)}
      />
    </div>
  )
}
