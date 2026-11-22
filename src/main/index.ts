import { spawn } from 'node:child_process'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { app, BrowserWindow, ipcMain, nativeTheme, powerMonitor } from 'electron'
import { CHANNEL_PREFIX, IPC_METHODS } from '../shared/ipc'
import { resolveLanguage } from '../domain/language'
import { createServices } from './app/services'
import { registerConnector, registrationHome } from './connector/register'
import { nodeRegisterFs, runReg } from './connector/register/fs'
import { createWindow, devIcon, isFromApp, sendToWindows, showWindow } from './app/window'
import { openDatabase } from './db/connection'
import { Repository } from './db/repository'
import { applyMenu, setSettingsAction } from './menu'
import { userDataDir } from './paths'
import { UNKNOWN_SENDER } from './security'
import { runSmokeTest } from './smoke'
import { watchExternalChanges } from './watch'

// The same folder the MCP server computes without Electron (paths.ts); must run
// before `ready`. FINDY_USER_DATA_DIR isolates e2e tests and screenshots.
app.setPath('userData', userDataDir())

/** Spec 004 FR-009: the MCP server runs this binary in Node mode (architecture D-8) */
const MCP_SCRIPT = join(__dirname, 'mcp.js')
/** Spec 019: the browser extension's connector, also in Node mode (architecture D-18) */
const CONNECTOR_SCRIPT = join(__dirname, 'connector.js')

function start(): void {
  if (devIcon && process.platform === 'darwin') app.dock?.setIcon(devIcon)
  const opened = openDatabase(app.getPath('userData'))
  const repository = opened.status === 'ok' ? new Repository(opened.db) : null

  nativeTheme.themeSource = repository?.getSettings().theme ?? 'system'
  // Spec 018 FR-002, FR-004: the window asks the renderer; off without a database
  setSettingsAction({
    enabled: repository !== null,
    open: () => showWindow()?.webContents.send(CHANNEL_PREFIX + 'openSettings'),
  })
  applyMenu(resolveLanguage(repository?.getSettings().language ?? null, app.getLocale()))

  const { handlers, reminders } = createServices(opened, repository, MCP_SCRIPT)
  for (const method of IPC_METHODS) {
    ipcMain.handle(CHANNEL_PREFIX + method, async (event, ...args: unknown[]) => {
      if (!isFromApp(event)) return UNKNOWN_SENDER
      const result = await handlers[method](...args)
      // Spec 015: a step set 10 minutes ahead gets its reminder at once
      reminders?.check()
      return result
    })
  }

  // Spec 004 FR-006: show changes made by the MCP server in the open window
  if (opened.status === 'ok') {
    const stop = watchExternalChanges(
      () => opened.db.pragma('data_version', { simple: true }) as number,
      () => {
        sendToWindows('stateChanged')
        reminders?.check()
      },
    )
    app.on('will-quit', stop)
  }

  app.on('will-quit', () => {
    if (opened.status === 'ok') opened.db.close()
  })

  createWindow()

  // Spec 019 FR-011: tell the installed browsers where the connector is. A failure only
  // means that the extension shows "Findy not found"; it never stops the app.
  const home = registrationHome(app.isPackaged, process.env, homedir())
  if (home)
    registerConnector({
      platform: process.platform,
      home,
      userData: app.getPath('userData'),
      execPath: process.execPath,
      script: CONNECTOR_SCRIPT,
      appImage: process.env.APPIMAGE,
      userDataDir: process.env.FINDY_USER_DATA_DIR,
      env: process.env.FINDY_CONNECTOR_HOME ? {} : process.env,
      fs: nodeRegisterFs,
      // A test folder never changes the registry of the user
      runReg: process.env.FINDY_CONNECTOR_HOME ? async () => {} : runReg,
    }).catch((error: unknown) =>
      console.error('Findy could not register the browser connector', error),
    )

  // Spec 015 FR-032: a check at start, then every 10 seconds and on wake
  if (reminders) {
    const stop = reminders.start()
    powerMonitor.on('resume', reminders.check)
    app.on('will-quit', stop)
  }
}

/**
 * Spec 004: `Findy --mcp` starts the MCP server in Node mode with the same stdio,
 * for clients configured with the short command, and for the AppImage. Spec 019:
 * `Findy --connector` does the same for the AppImage launcher of the extension.
 */
function forwardToNode(script: string): void {
  const child = spawn(process.execPath, [script], {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    stdio: 'inherit',
  })
  child.on('exit', (code) => app.exit(code ?? 0))
}

if (process.argv.includes('--mcp')) {
  app.dock?.hide()
  forwardToNode(MCP_SCRIPT)
} else if (process.argv.includes('--connector')) {
  app.dock?.hide()
  forwardToNode(CONNECTOR_SCRIPT)
} else if (process.env.FINDY_SMOKE_TEST === '1') {
  process.exit(runSmokeTest())
}

// One window instance only: two app windows would race on the database (spec 001, edge cases)
else if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    showWindow()
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
