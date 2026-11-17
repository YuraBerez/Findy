import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { errorKind } from '@shared/ipc'
import { ToastViewport, type ToastMessage } from '@ui'
import { NotificationsContext } from './context'

const MAX_VISIBLE = 3

/** One place that turns failures into notifications (spec 003). */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const notifyError = useCallback(
    (error: unknown) => {
      const text = t(`errors.${errorKind(error)}`)
      setToasts((current) =>
        [...current, { id: Date.now() + Math.random(), text }].slice(-MAX_VISIBLE),
      )
    },
    [t],
  )

  // FR-005: errors that no code caught still reach the user
  useEffect(() => {
    const onRejection = (event: PromiseRejectionEvent) => notifyError(event.reason)
    const onError = (event: ErrorEvent) => notifyError(event.error)
    window.addEventListener('unhandledrejection', onRejection)
    window.addEventListener('error', onError)
    return () => {
      window.removeEventListener('unhandledrejection', onRejection)
      window.removeEventListener('error', onError)
    }
  }, [notifyError])

  const dismiss = useCallback(
    (id: number) => setToasts((current) => current.filter((toast) => toast.id !== id)),
    [],
  )
  const value = useMemo(() => ({ notifyError }), [notifyError])
  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} closeLabel={t('common.close')} onDismiss={dismiss} />
    </NotificationsContext.Provider>
  )
}
