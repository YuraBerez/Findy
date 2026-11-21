import { join } from 'node:path'
import { app, BrowserWindow } from 'electron'
import { CHANNEL_PREFIX, type IpcEvent } from '../../shared/ipc'
import { isAllowedNavigation } from '../security'

const devServerUrl = process.env.ELECTRON_RENDERER_URL

// A packaged app takes its icon from the bundle; an unpacked run (npm run dev, e2e)
// would show Electron's default icon in the Dock / taskbar, so set Findy's
export const devIcon = app.isPackaged ? undefined : join(app.getAppPath(), 'build', 'icon.png')

export function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    title: 'Findy',
    icon: devIcon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  })

  win.once('ready-to-show', () => win.show())

  // docs/security.md: no new windows, no navigation away from the app
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedNavigation(url, devServerUrl)) event.preventDefault()
  })

  if (devServerUrl) void win.loadURL(devServerUrl)
  else void win.loadFile(join(__dirname, '../renderer/index.html'))
  return win
}

/** The app window to the front, also from the Dock or another app */
export function showWindow(): BrowserWindow | undefined {
  const [win] = BrowserWindow.getAllWindows()
  if (!win) return undefined
  if (win.isMinimized()) win.restore()
  win.show()
  win.focus()
  return win
}

/** An event to every window (docs/contracts/ipc.md) */
export function sendToWindows(event: IpcEvent): void {
  for (const win of BrowserWindow.getAllWindows()) win.webContents.send(CHANNEL_PREFIX + event)
}
