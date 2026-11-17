import { join } from 'node:path'
import { app, BrowserWindow, ipcMain, nativeTheme, shell } from 'electron'
import { CHANNEL_PREFIX, IPC_METHODS } from '../shared/ipc'
import { openDatabase } from './db/connection'
import { Repository } from './db/repository'
import { createHandlers } from './ipc'
import { isAllowedNavigation } from './security'
import { runSmokeTest } from './smoke'

// Isolated data dir for e2e tests and screenshots; must run before `ready`.
if (process.env.FINDY_USER_DATA_DIR) {
  app.setPath('userData', process.env.FINDY_USER_DATA_DIR)
}

const devServerUrl = process.env.ELECTRON_RENDERER_URL

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    title: 'Findy',
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

function start(): void {
  const opened = openDatabase(app.getPath('userData'))
  const repository = opened.status === 'ok' ? new Repository(opened.db) : null
  const storage =
    opened.status === 'ok'
      ? { status: 'ok' as const, dataFilePath: opened.dataFilePath }
      : {
          status: 'error' as const,
          error: opened.error,
          dataFilePath: opened.dataFilePath,
          backupPath: opened.backupPath,
        }

  nativeTheme.themeSource = repository?.getSettings().theme ?? 'system'

  const handlers = createHandlers({
    repository,
    storage,
    appVersion: app.getVersion(),
    getSystemLocale: () => app.getLocale(),
    openExternal: (url) => shell.openExternal(url),
    applyTheme: (theme) => {
      nativeTheme.themeSource = theme
    },
  })
  for (const method of IPC_METHODS) {
    ipcMain.handle(CHANNEL_PREFIX + method, (_event, ...args: unknown[]) =>
      handlers[method](...args),
    )
  }

  app.on('will-quit', () => {
    if (opened.status === 'ok') opened.db.close()
  })

  createWindow()
}

if (process.env.FINDY_SMOKE_TEST === '1') {
  process.exit(runSmokeTest())
}

// One instance only: two writers would race on the database (spec 001, edge cases)
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows()
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  void app.whenReady().then(() => {
    start()
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
