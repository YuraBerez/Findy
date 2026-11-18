import { app, Menu, shell } from 'electron'
import type { Language } from '../domain/types'
import { createMainTranslator } from './i18n'
import { PROJECT_URL } from '../shared/project'
import { buildMenuTemplate } from './menuTemplate'

/** Builds and installs the native menu in `language`; call again after a change (FR-044). */
export function applyMenu(language: Language): void {
  const t = createMainTranslator(language)
  app.setAboutPanelOptions({
    applicationName: 'Findy',
    applicationVersion: app.getVersion(),
    copyright: t('menu.copyright'),
    website: PROJECT_URL,
  })
  const template = buildMenuTemplate({
    t,
    platform: process.platform,
    isDev: !app.isPackaged,
    openProjectPage: () => void shell.openExternal(PROJECT_URL),
  })
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
