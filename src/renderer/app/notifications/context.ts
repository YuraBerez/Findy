import { createContext, useContext } from 'react'

export interface Notifications {
  /** Shows the message for this failure, by its error code (spec 003 FR-002) */
  notifyError(error: unknown): void
}

export const NotificationsContext = createContext<Notifications | null>(null)

export function useNotifications(): Notifications {
  const value = useContext(NotificationsContext)
  if (!value) throw new Error('useNotifications outside <NotificationsProvider>')
  return value
}
