import type { MenuItemConstructorOptions } from 'electron'
import { describe, expect, it, vi } from 'vitest'
import { createMainTranslator } from '../../src/main/i18n'
import { buildMenuTemplate } from '../../src/main/menuTemplate'

const labels = (items: MenuItemConstructorOptions[]) => items.map((item) => item.label)
const submenu = (item: MenuItemConstructorOptions | undefined) =>
  (item?.submenu as MenuItemConstructorOptions[]).filter((entry) => entry.type !== 'separator')

describe('native menu (FR-044, FR-072)', () => {
  it('is translated into Ukrainian, with roles kept', () => {
    const template = buildMenuTemplate({
      t: createMainTranslator('uk'),
      platform: 'darwin',
      isDev: false,
      openProjectPage: vi.fn(),
      openSupportPage: vi.fn(),
      settings: { enabled: true, open: vi.fn() },
    })
    expect(labels(template)).toEqual(['Findy', 'Редагування', 'Вигляд', 'Вікно', 'Довідка'])
    const edit = submenu(template[1])
    expect(edit.map((item) => [item.role, item.label])).toContainEqual(['copy', 'Копіювати'])
    expect(submenu(template[0])[0]).toMatchObject({ role: 'about', label: 'Про Findy' })
  })

  it('is complete in English and every label is translated', () => {
    const template = buildMenuTemplate({
      t: createMainTranslator('en'),
      platform: 'win32',
      isDev: true,
      openProjectPage: vi.fn(),
      openSupportPage: vi.fn(),
      settings: { enabled: true, open: vi.fn() },
    })
    expect(labels(template)).toEqual(['File', 'Edit', 'View', 'Window', 'Help'])
    const all = template.flatMap((top) => [top, ...submenu(top)])
    for (const item of all) expect(item.label, String(item.role)).not.toMatch(/^menu\./)
    // Windows/Linux: About in Help; dev tools only while developing
    expect(submenu(template[4]).map((item) => item.role)).toContain('about')
    expect(submenu(template[2]).map((item) => item.role)).toContain('toggleDevTools')
  })

  it('hides developer items in a packaged app and opens the project page', () => {
    const openProjectPage = vi.fn()
    const template = buildMenuTemplate({
      t: createMainTranslator('en'),
      platform: 'linux',
      isDev: false,
      openProjectPage,
      openSupportPage: vi.fn(),
      settings: { enabled: true, open: vi.fn() },
    })
    expect(submenu(template[2]).map((item) => item.role)).not.toContain('toggleDevTools')
    const project = submenu(template[4])[0]!
    ;(project.click as () => void)()
    expect(openProjectPage).toHaveBeenCalled()
  })

  it('opens the support page from Help (spec 013 FR-007)', () => {
    const openSupportPage = vi.fn()
    const template = buildMenuTemplate({
      t: createMainTranslator('uk'),
      platform: 'darwin',
      isDev: false,
      openProjectPage: vi.fn(),
      openSupportPage,
      settings: { enabled: true, open: vi.fn() },
    })
    const support = submenu(template[4]).find((item) => item.label === 'Підтримати Findy…')!
    ;(support.click as () => void)()
    expect(openSupportPage).toHaveBeenCalled()
  })

  it('has Settings… with Cmd/Ctrl+, in the Findy menu or the File menu (spec 018 FR-002)', () => {
    const open = vi.fn()
    const mac = buildMenuTemplate({
      t: createMainTranslator('en'),
      platform: 'darwin',
      isDev: false,
      openProjectPage: vi.fn(),
      openSupportPage: vi.fn(),
      settings: { enabled: true, open },
    })
    const item = submenu(mac[0]).find((entry) => entry.label === 'Settings…')!
    expect(item).toMatchObject({ accelerator: 'CmdOrCtrl+,', enabled: true })
    ;(item.click as () => void)()
    expect(open).toHaveBeenCalled()

    const windows = buildMenuTemplate({
      t: createMainTranslator('uk'),
      platform: 'win32',
      isDev: false,
      openProjectPage: vi.fn(),
      openSupportPage: vi.fn(),
      settings: { enabled: false, open },
    })
    expect(submenu(windows[0])[0]).toMatchObject({
      label: 'Налаштування…',
      accelerator: 'CmdOrCtrl+,',
      enabled: false,
    })
  })
})
