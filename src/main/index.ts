import { join } from 'node:path'
import { app, BrowserWindow, ipcMain, nativeTheme, shell } from 'electron'
import { CHANNEL_PREFIX, IPC_METHODS } from '../shared/ipc'
import { backupDatabase, openDatabase } from './db/connection'
import { Repository } from './db/repository'
import { resolveLanguage } from '../domain/language'
import { createHandlers } from './ipc'
import { runMcpServer } from './mcp/server'
import { applyMenu } from './menu'
import { isAllowedNavigation } from './security'
import { runSmokeTest } from './smoke'

// Isolated data dir for e2e tests and screenshots; must run before `ready`.
if (process.env.FINDY_USER_DATA_DIR) {
  app.setPath('userData', process.env.FINDY_USER_DATA_DIR)
}

const devServerUrl = process.env.ELECTRON_RENDERER_URL

// A packaged app takes its icon from the bundle; an unpacked run (npm run dev, e2e)
// would show Electron's default icon in the Dock / taskbar, so set Findy's
const devIcon = app.isPackaged ? undefined : join(app.getAppPath(), 'build', 'icon.png')

function createWindow(): BrowserWindow {
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

function start(): void {
  if (devIcon && process.platform === 'darwin') app.dock?.setIcon(devIcon)
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
  applyMenu(resolveLanguage(repository?.getSettings().language ?? null, app.getLocale()))

  const handlers = createHandlers({
    repository,
    storage,
    appVersion: app.getVersion(),
    getSystemLocale: () => app.getLocale(),
    openExternal: (url) => shell.openExternal(url),
    applyTheme: (theme) => {
      nativeTheme.themeSource = theme
    },
    applyLanguage: applyMenu,
    backup: (label) => {
      if (opened.status === 'ok') backupDatabase(opened.db, app.getPath('userData'), label)
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

/**
 * Spec 004: `Findy --mcp` serves MCP tools over stdio for an AI assistant. No
 * window, no Dock icon, no single-instance lock (it runs next to the open app).
 * stdout carries the protocol, so every log goes to stderr.
 */
async function startMcp(): Promise<void> {
  console.log = console.info = console.debug = console.error
  app.dock?.hide()
  const opened = openDatabase(app.getPath('userData'))
  const repository = opened.status === 'ok' ? new Repository(opened.db) : null
  await runMcpServer(
    repository,
    app.getVersion(),
    `Findy cannot open its database (${opened.dataFilePath}). Open the Findy app to see what is wrong.`,
  )
  if (opened.status === 'ok') opened.db.close()
  app.exit(0)
}

if (process.argv.includes('--mcp')) {
  app.disableHardwareAcceleration()
  void startMcp()
} else if (process.env.FINDY_SMOKE_TEST === '1') {
  process.exit(runSmokeTest())
}

// One window instance only: two app windows would race on the database (spec 001, edge cases)
else if (!app.requestSingleInstanceLock()) {
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
