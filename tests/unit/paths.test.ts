import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { userDataDir } from '../../src/main/paths'

describe('userDataDir (architecture D-8)', () => {
  it("matches Electron's userData folder for Findy on each OS", () => {
    expect(userDataDir({}, 'darwin', '/Users/ann')).toBe(
      join('/Users/ann', 'Library', 'Application Support', 'Findy'),
    )
    expect(userDataDir({ APPDATA: 'C:/Users/ann/AppData/Roaming' }, 'win32', 'C:/Users/ann')).toBe(
      join('C:/Users/ann/AppData/Roaming', 'Findy'),
    )
    expect(userDataDir({}, 'win32', 'C:/Users/ann')).toBe(
      join('C:/Users/ann', 'AppData', 'Roaming', 'Findy'),
    )
    expect(userDataDir({}, 'linux', '/home/ann')).toBe(join('/home/ann', '.config', 'Findy'))
    expect(userDataDir({ XDG_CONFIG_HOME: '/cfg' }, 'linux', '/home/ann')).toBe(
      join('/cfg', 'Findy'),
    )
  })

  it('uses FINDY_USER_DATA_DIR when it is set (e2e, screenshots)', () => {
    expect(userDataDir({ FINDY_USER_DATA_DIR: '/tmp/x' }, 'darwin', '/Users/ann')).toBe('/tmp/x')
  })
})
