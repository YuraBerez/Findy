import { Notification } from 'electron'
import { CHANNEL_PREFIX } from '../../shared/ipc'
import type { ReminderNotice } from '../reminders'
import { showWindow } from './window'

/** Spec 015: the shown notifications; kept so that a click still arrives after GC */
const notifications = new Set<Notification>()

/** Spec 015 FR-035, FR-037: a blocked or unsupported notification fails silently */
export function showNotice(notice: ReminderNotice): void {
  if (!Notification.isSupported()) return
  try {
    const notification = new Notification({ title: notice.title, body: notice.body })
    notifications.add(notification)
    notification.on('click', () => {
      const win = showWindow()
      if (win) win.webContents.send(CHANNEL_PREFIX + 'openApplication', notice.applicationId)
    })
    notification.on('close', () => notifications.delete(notification))
    notification.show()
  } catch {
    // FR-037: Findy works as usual without notifications
  }
}
