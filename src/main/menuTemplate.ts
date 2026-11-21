import type { MenuItemConstructorOptions } from 'electron'
import type { Translate } from './i18n'

interface Options {
  t: Translate
  platform: NodeJS.Platform
  /** Reload and DevTools only while developing */
  isDev: boolean
  openProjectPage(): void
  /** Spec 013 FR-007 */
  openSupportPage(): void
  /** Spec 018 FR-002: the settings window; off when the database cannot be opened (FR-004) */
  settings: { enabled: boolean; open(): void }
}

/**
 * The native application menu in the UI language (FR-044), and "About Findy" with the
 * version (FR-072). Pure, so it is unit-tested without Electron. Standard actions
 * keep their roles (system shortcuts and behaviour) and get translated labels.
 */
export function buildMenuTemplate({
  t,
  platform,
  isDev,
  openProjectPage,
  openSupportPage,
  settings,
}: Options): MenuItemConstructorOptions[] {
  const mac = platform === 'darwin'
  const item = (
    role: MenuItemConstructorOptions['role'],
    key: string,
  ): MenuItemConstructorOptions => ({
    role,
    label: t(`menu.${key}`),
  })

  // Spec 018 FR-002: Cmd+, / Ctrl+, opens the window through this item
  const settingsItem: MenuItemConstructorOptions = {
    label: t('menu.settings'),
    accelerator: 'CmdOrCtrl+,',
    enabled: settings.enabled,
    click: settings.open,
  }

  const appMenu: MenuItemConstructorOptions = {
    label: 'Findy',
    submenu: [
      item('about', 'about'),
      { type: 'separator' },
      settingsItem,
      { type: 'separator' },
      item('hide', 'hide'),
      item('hideOthers', 'hideOthers'),
      item('unhide', 'showAll'),
      { type: 'separator' },
      item('quit', 'quit'),
    ],
  }

  const edit: MenuItemConstructorOptions = {
    label: t('menu.edit'),
    submenu: [
      item('undo', 'undo'),
      item('redo', 'redo'),
      { type: 'separator' },
      item('cut', 'cut'),
      item('copy', 'copy'),
      item('paste', 'paste'),
      item('selectAll', 'selectAll'),
    ],
  }

  const view: MenuItemConstructorOptions = {
    label: t('menu.view'),
    submenu: [
      ...(isDev
        ? [
            item('reload', 'reload'),
            item('toggleDevTools', 'devTools'),
            { type: 'separator' as const },
          ]
        : []),
      item('resetZoom', 'resetZoom'),
      item('zoomIn', 'zoomIn'),
      item('zoomOut', 'zoomOut'),
      { type: 'separator' },
      item('togglefullscreen', 'fullScreen'),
    ],
  }

  const windowMenu: MenuItemConstructorOptions = {
    label: t('menu.window'),
    submenu: [
      item('minimize', 'minimize'),
      item('zoom', 'zoom'),
      ...(mac ? [] : [item('close', 'close')]),
    ],
  }

  const help: MenuItemConstructorOptions = {
    role: 'help',
    label: t('menu.help'),
    submenu: [
      { label: t('menu.projectPage'), click: openProjectPage },
      { label: t('menu.support'), click: openSupportPage },
      // On macOS "About" lives in the app menu
      ...(mac ? [] : [{ type: 'separator' as const }, item('about', 'about')]),
    ],
  }

  return [
    ...(mac
      ? [appMenu]
      : [
          {
            label: t('menu.file'),
            submenu: [settingsItem, { type: 'separator' as const }, item('quit', 'quit')],
          },
        ]),
    edit,
    view,
    windowMenu,
    help,
  ]
}
