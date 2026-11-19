import { randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { app, BrowserWindow, dialog, ipcMain, nativeTheme, net, shell } from 'electron'
import { CHANNEL_PREFIX, IPC_METHODS } from '../shared/ipc'
import { backupDatabase, openDatabase } from './db/connection'
import { Repository } from './db/repository'
import { resolveLanguage } from '../domain/language'
import { createHandlers } from './ipc'
import { userDataDir } from './paths'
import { createIconFetcher } from './siteIcons'
import { readVacancyPage } from './vacancy'
import { watchExternalChanges } from './watch'
import { applyMenu } from './menu'
import { isAllowedNavigation } from './security'
import { runSmokeTest } from './smoke'
import { createTransfer } from './transfer'
import { createUpdateChecker, fetchLatestRelease } from './updates'

// The same folder the MCP server computes without Electron (paths.ts); must run
// before `ready`. FINDY_USER_DATA_DIR isolates e2e tests and screenshots.
app.setPath('userData', userDataDir())

/** Spec 004 FR-009: the MCP server runs this binary in Node mode (architecture D-8) */
const MCP_SCRIPT = join(__dirname, 'mcp.js')

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

  // Spec 006. FINDY_RELEASES_URL points e2e tests at a local release server (plan D-4);
  // a packaged app ignores it, so it always asks the project's own release page
  const releasesUrl = app.isPackaged ? undefined : process.env.FINDY_RELEASES_URL
  const checkForUpdates = createUpdateChecker({
    fetchLatest: () =>
      fetchLatestRelease((input, init) => net.fetch(String(input), init), { url: releasesUrl }),
    currentVersion: app.getVersion(),
    settings: repository && {
      autoCheck: () => repository.getSettings().autoUpdateCheck,
      lastCheck: () => repository.getLastUpdateCheck(),
      recordCheck: (at) => repository.setLastUpdateCheck(at),
    },
  })

  // Spec 008: files only through the system dialogs (FR-031)
  const csvFilter = [{ name: 'CSV', extensions: ['csv'] }]
  const transfer =
    repository &&
    createTransfer({
      repository,
      pickSavePath: async (defaultPath) => {
        const owner = BrowserWindow.getFocusedWindow()
        const options = { defaultPath, filters: csvFilter }
        const result = await (owner
          ? dialog.showSaveDialog(owner, options)
          : dialog.showSaveDialog(options))
        return result.canceled ? null : (result.filePath ?? null)
      },
      pickOpenPath: async () => {
        const owner = BrowserWindow.getFocusedWindow()
        const options = { properties: ['openFile' as const], filters: csvFilter }
        const result = await (owner
          ? dialog.showOpenDialog(owner, options)
          : dialog.showOpenDialog(options))
        return result.canceled ? null : (result.filePaths[0] ?? null)
      },
      fileSize: async (path) => (await stat(path)).size,
      readText: (path) => readFile(path, 'utf8'),
      writeText: (path, text) => writeFile(path, text, 'utf8'),
      now: () => new Date(),
      newToken: randomUUID,
    })

  const handlers = createHandlers({
    repository,
    transfer,
    storage,
    appVersion: app.getVersion(),
    getSystemLocale: () => app.getLocale(),
    openExternal: (url) => shell.openExternal(url),
    applyTheme: (theme) => {
      nativeTheme.themeSource = theme
    },
    applyLanguage: applyMenu,
    checkForUpdates,
    // Spec 009 plan D-2: Node's fetch has no cookie store, and gives redirects to check
    readVacancy: (url) => readVacancyPage(fetch, url),
    siteIcons:
      repository &&
      createIconFetcher({
        fetchFn: fetch,
        store: repository,
        onChange: () => {
          for (const win of BrowserWindow.getAllWindows())
            win.webContents.send(CHANNEL_PREFIX + 'siteIconsChanged')
        },
        // Spec 011 NFR-003: e2e serves icons locally; a packaged app ignores it
        origin: app.isPackaged ? undefined : process.env.FINDY_SITE_ICONS_URL,
      }),
    mcpConnection: () =>
      // An AppImage is mounted at a new path on every start: point at the file
      // itself, which forwards `--mcp` to Node mode
      process.env.APPIMAGE
        ? { command: process.env.APPIMAGE, args: ['--mcp'], env: {} as Record<string, string> }
        : { command: process.execPath, args: [MCP_SCRIPT], env: { ELECTRON_RUN_AS_NODE: '1' } },
    backup: (label) => {
      if (opened.status === 'ok') backupDatabase(opened.db, app.getPath('userData'), label)
    },
  })
  for (const method of IPC_METHODS) {
    ipcMain.handle(CHANNEL_PREFIX + method, (_event, ...args: unknown[]) =>
      handlers[method](...args),
    )
  }

  // Spec 004 FR-006: show changes made by the MCP server in the open window
  if (opened.status === 'ok') {
    const stop = watchExternalChanges(
      () => opened.db.pragma('data_version', { simple: true }) as number,
      () => {
        for (const win of BrowserWindow.getAllWindows())
          win.webContents.send(CHANNEL_PREFIX + 'stateChanged')
      },
    )
    app.on('will-quit', stop)
  }

  app.on('will-quit', () => {
    if (opened.status === 'ok') opened.db.close()
  })

  createWindow()
}

/**
 * Spec 004: `Findy --mcp` starts the MCP server in Node mode with the same stdio,
 * for clients configured with the short command, and for the AppImage.
 */
function forwardToMcp(): void {
  const child = spawn(process.execPath, [MCP_SCRIPT], {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    stdio: 'inherit',
  })
  child.on('exit', (code) => app.exit(code ?? 0))
}

if (process.argv.includes('--mcp')) {
  app.dock?.hide()
  forwardToMcp()
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
