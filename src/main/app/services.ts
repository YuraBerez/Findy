import { randomUUID } from 'node:crypto'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { app, clipboard, ClipboardItem, nativeImage, nativeTheme, net, shell } from 'electron'
import { resolveLanguage } from '../../domain/language'
import skillText from '../../../skills/findy/SKILL.md?raw'
import { createCalendarSaver } from '../calendar'
import { createImageSharer } from '../image'
import { backupDatabase, type OpenResult } from '../db/connection'
import type { Repository } from '../db/repository'
import { createMainTranslator } from '../i18n'
import { createHandlers } from '../ipc'
import { applyMenu } from '../menu'
import { createReminders } from '../reminders'
import { createIconFetcher } from '../siteIcons'
import { createSkillSaver } from '../skill'
import { createTransfer } from '../transfer'
import { createUpdateChecker, fetchLatestRelease } from '../updates'
import { readVacancyPage } from '../vacancy'
import { pickOpenPath, pickSavePath } from './dialogs'
import { showNotice } from './notices'
import { sendToWindows } from './window'

/**
 * Creates every main-process service from the opened database. `repository` is null when
 * the database could not be opened: the services that need it are null too, and the IPC
 * handlers answer with a storage error.
 */
export function createServices(
  opened: OpenResult,
  repository: Repository | null,
  mcpScript: string,
) {
  const storage =
    opened.status === 'ok'
      ? { status: 'ok' as const, dataFilePath: opened.dataFilePath }
      : {
          status: 'error' as const,
          error: opened.error,
          dataFilePath: opened.dataFilePath,
          backupPath: opened.backupPath,
        }

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
  const csvFilter = { name: 'CSV', extensions: ['csv'] }
  const transfer =
    repository &&
    createTransfer({
      repository,
      pickSavePath: (defaultPath) => pickSavePath(defaultPath, csvFilter),
      pickOpenPath: () => pickOpenPath(csvFilter),
      fileSize: async (path) => (await stat(path)).size,
      readText: (path) => readFile(path, 'utf8'),
      writeText: (path, text) => writeFile(path, text, 'utf8'),
      now: () => new Date(),
      newToken: randomUUID,
    })

  // Spec 016: the skill of this version; saving needs no database and no network
  const skill = createSkillSaver({
    version: app.getVersion(),
    skillText,
    pickSavePath: (defaultPath) => pickSavePath(defaultPath, { name: 'ZIP', extensions: ['zip'] }),
    writeBytes: (path, data) => writeFile(path, data),
  })

  // Spec 015 FR-040: the calendar file; no network
  const calendar = createCalendarSaver({
    pickSavePath: (defaultPath) =>
      pickSavePath(defaultPath, { name: 'iCalendar', extensions: ['ics'] }),
    writeText: (path, text) => writeFile(path, text, 'utf8'),
    now: () => new Date(),
  })

  // Spec 023 plan D-2: the analytics image; no database and no network
  const image = createImageSharer({
    writeClipboard: async (png) => {
      if (nativeImage.createFromBuffer(Buffer.from(png)).isEmpty()) {
        throw new Error('The image cannot be decoded')
      }
      const blob = new Blob([png], { type: 'image/png' })
      await clipboard.write([new ClipboardItem({ 'image/png': blob })])
    },
    pickSavePath: (defaultPath) => pickSavePath(defaultPath, { name: 'PNG', extensions: ['png'] }),
    writeBytes: (path, data) => writeFile(path, data),
    now: () => new Date(),
  })

  // Spec 015 FR-031…FR-037: only the app process shows notifications, never the MCP server
  const reminders =
    repository &&
    createReminders({
      listSteps: () => repository.listNextSteps(),
      enabled: () => repository.getSettings().remindersEnabled,
      translator: () => {
        const language = resolveLanguage(repository.getSettings().language, app.getLocale())
        return { t: createMainTranslator(language), language }
      },
      show: showNotice,
      now: () => new Date(),
    })

  const handlers = createHandlers({
    repository,
    transfer,
    storage,
    appVersion: app.getVersion(),
    saveSkill: () => skill.save(),
    calendar,
    image,
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
        onChange: () => sendToWindows('siteIconsChanged'),
        // Spec 011 NFR-003: e2e serves icons locally; a packaged app ignores it
        origin: app.isPackaged ? undefined : process.env.FINDY_SITE_ICONS_URL,
      }),
    mcpConnection: () =>
      // An AppImage is mounted at a new path on every start: point at the file
      // itself, which forwards `--mcp` to Node mode
      process.env.APPIMAGE
        ? { command: process.env.APPIMAGE, args: ['--mcp'], env: {} as Record<string, string> }
        : { command: process.execPath, args: [mcpScript], env: { ELECTRON_RUN_AS_NODE: '1' } },
    backup: (label) => {
      if (opened.status === 'ok') backupDatabase(opened.db, app.getPath('userData'), label)
    },
  })

  return { handlers, reminders }
}
