import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  hostManifest,
  launcherFile,
  MANIFEST_FILE,
  registerConnector,
  type RegisterFs,
} from '../../src/main/connector/register'
import { browserFolders } from '../../src/main/connector/register/browsers'
import {
  CHROMIUM_EXTENSION_ORIGIN,
  EXTENSION_HOST,
  FIREFOX_EXTENSION_ID,
} from '../../src/shared/extension'

/** An in-memory file system that records every write */
function memoryFs(
  existing: string[] = [],
): RegisterFs & { files: Map<string, string>; writes: string[] } {
  const files = new Map<string, string>()
  const folders = new Set(existing)
  const writes: string[] = []
  return {
    files,
    writes,
    exists: (path) => folders.has(path) || files.has(path),
    readText: (path) => files.get(path) ?? null,
    writeText: (path, content) => {
      files.set(path, content)
      writes.push(path)
    },
    mkdir: (path) => void folders.add(path),
  }
}

const target = {
  execPath: '/Apps/Findy.app/Contents/MacOS/Findy',
  script: '/Apps/app.asar/out/main/connector.js',
}

describe('host manifest (spec 019 FR-011, NFR-002)', () => {
  it('accepts only the store extension of each browser family', () => {
    expect(JSON.parse(hostManifest('chromium', '/l.sh'))).toEqual({
      name: EXTENSION_HOST,
      description: expect.any(String),
      path: '/l.sh',
      type: 'stdio',
      allowed_origins: [CHROMIUM_EXTENSION_ORIGIN],
    })
    expect(JSON.parse(hostManifest('firefox', '/l.sh'))).toMatchObject({
      allowed_extensions: [FIREFOX_EXTENSION_ID],
    })
    expect(MANIFEST_FILE).toBe(`${EXTENSION_HOST}.json`)
  })
})

describe('launcher (spec 019 plan D-1)', () => {
  it('starts the binary in Node mode with sh, escaping the paths', () => {
    const file = launcherFile('darwin', { execPath: '/My "Apps"/$Findy', script: '/s`x`.js' })
    expect(file.name).toBe('findy-connector.sh')
    expect(file.content.startsWith('#!/bin/sh\n')).toBe(true)
    expect(file.content).toContain(
      'ELECTRON_RUN_AS_NODE=1 exec "/My \\"Apps\\"/\\$Findy" "/s\\`x\\`.js"',
    )
  })

  it('runs the AppImage with --connector', () => {
    const file = launcherFile('linux', { ...target, appImage: '/home/u/Findy.AppImage' })
    expect(file.content).toContain('exec "/home/u/Findy.AppImage" --connector')
    expect(file.content).not.toContain('ELECTRON_RUN_AS_NODE')
  })

  it('writes a cmd file on Windows, with % doubled', () => {
    const file = launcherFile('win32', {
      execPath: 'C:\\Users\\a%b\\Findy.exe',
      script: 'C:\\Findy\\resources\\app.asar\\out\\main\\connector.js',
    })
    expect(file.name).toBe('findy-connector.cmd')
    expect(file.content.split('\r\n')).toEqual([
      '@echo off',
      expect.stringMatching(/^rem /),
      'set ELECTRON_RUN_AS_NODE=1',
      '"C:\\Users\\a%%b\\Findy.exe" "C:\\Findy\\resources\\app.asar\\out\\main\\connector.js"',
      '',
    ])
  })
})

describe('browser folders (spec 019 FR-012)', () => {
  it('knows the Chromium browsers and Firefox on macOS and Linux, none on other systems', () => {
    expect(browserFolders('darwin', '/Users/u').map((browser) => browser.name)).toEqual([
      'Chrome',
      'Opera',
      'Chromium',
      'Edge',
      'Brave',
      'Vivaldi',
      'Firefox',
    ])
    const linux = browserFolders('linux', '/home/u', { XDG_CONFIG_HOME: '/cfg' })
    expect(linux.find((browser) => browser.name === 'Brave')?.hosts).toBe(
      join('/cfg', 'BraveSoftware', 'Brave-Browser', 'NativeMessagingHosts'),
    )
    expect(linux.find((browser) => browser.name === 'Firefox')?.hosts).toBe(
      join('/home/u', '.mozilla', 'native-messaging-hosts'),
    )
    expect(browserFolders('linux', '/home/u').find((b) => b.name === 'Chrome')?.profile).toBe(
      join('/home/u', '.config', 'google-chrome'),
    )
    expect(browserFolders('freebsd', '/home/u')).toEqual([])
  })

  it('writes Opera into the folder of Chrome', () => {
    const [chrome, opera] = browserFolders('darwin', '/Users/u')
    expect(opera?.hosts).toBe(chrome?.hosts)
  })
})

describe('register the connector (spec 019 FR-011)', () => {
  const support = join('/Users/u', 'Library', 'Application Support')
  const options = (fs: RegisterFs, runReg: (args: string[]) => Promise<void> = async () => {}) => ({
    ...target,
    platform: 'darwin' as const,
    home: '/Users/u',
    userData: join(support, 'Findy'),
    fs,
    runReg,
  })

  it('writes the launcher and a manifest only for installed browsers', async () => {
    const fs = memoryFs([join(support, 'Google', 'Chrome'), join(support, 'Firefox')])
    const result = await registerConnector(options(fs))
    const launcher = join(support, 'Findy', 'connector', 'findy-connector.sh')
    expect(result).toEqual({ launcher, browsers: ['Chrome', 'Firefox'] })
    expect(
      JSON.parse(
        fs.files.get(join(support, 'Google', 'Chrome', 'NativeMessagingHosts', MANIFEST_FILE))!,
      ).path,
    ).toBe(launcher)
    expect(fs.files.has(join(support, 'Mozilla', 'NativeMessagingHosts', MANIFEST_FILE))).toBe(true)
    expect(
      fs.files.has(join(support, 'Microsoft Edge', 'NativeMessagingHosts', MANIFEST_FILE)),
    ).toBe(false)
  })

  it('writes nothing again when nothing changed, and rewrites after an update moved the app', async () => {
    const fs = memoryFs([join(support, 'Google', 'Chrome')])
    await registerConnector(options(fs))
    const first = fs.writes.length
    await registerConnector(options(fs))
    expect(fs.writes.length).toBe(first)
    await registerConnector({ ...options(fs), execPath: '/New/Findy' })
    expect(fs.writes.length).toBe(first + 1)
  })

  it('writes both manifests and the registry keys on Windows', async () => {
    const fs = memoryFs()
    const calls: string[][] = []
    const result = await registerConnector({
      ...options(fs, async (args) => void calls.push(args)),
      platform: 'win32',
      userData: 'C:\\Users\\u\\AppData\\Roaming\\Findy',
    })
    expect(result.browsers).toEqual(['Chrome', 'Chromium', 'Edge', 'Firefox'])
    expect(calls).toHaveLength(4)
    expect(calls[0]).toEqual([
      'add',
      `HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\${EXTENSION_HOST}`,
      '/ve',
      '/t',
      'REG_SZ',
      '/d',
      expect.stringContaining(`chromium-${MANIFEST_FILE}`),
      '/f',
    ])
    expect(calls[3]?.[1]).toContain('Mozilla')
    expect(calls[3]?.[6]).toContain(`firefox-${MANIFEST_FILE}`)
    expect([...fs.files.keys()].filter((path) => path.endsWith('.json'))).toHaveLength(2)
  })
})

describe('registration home (spec 019 FR-011)', () => {
  it('uses the real home only in a packaged app, or the folder of FINDY_CONNECTOR_HOME', async () => {
    const { registrationHome } = await import('../../src/main/connector/register')
    expect(registrationHome(true, {}, '/Users/u')).toBe('/Users/u')
    expect(registrationHome(false, {}, '/Users/u')).toBeNull()
    expect(registrationHome(false, { FINDY_CONNECTOR_HOME: '/tmp/h' }, '/Users/u')).toBe('/tmp/h')
  })
})

describe('register file system (spec 019 FR-011)', () => {
  it('writes, reads and makes the launcher runnable', async () => {
    const { mkdtempSync, rmSync, statSync } = await import('node:fs')
    const { tmpdir } = await import('node:os')
    const { nodeRegisterFs } = await import('../../src/main/connector/register/fs')
    const dir = mkdtempSync(join(tmpdir(), 'findy-register-'))
    try {
      const file = join(dir, 'a', 'b.sh')
      expect(nodeRegisterFs.readText(file)).toBeNull()
      nodeRegisterFs.mkdir(join(dir, 'a'))
      nodeRegisterFs.writeText(file, 'x', 0o755)
      nodeRegisterFs.writeText(join(dir, 'a', 'c.json'), 'y')
      expect(nodeRegisterFs.readText(file)).toBe('x')
      expect(nodeRegisterFs.exists(file)).toBe(true)
      if (process.platform !== 'win32') expect(statSync(file).mode & 0o111).not.toBe(0)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
