// Spec 019 FR-011: the real file system and `reg.exe` for `registerConnector`
import { execFile } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import type { RegisterFs } from './index'

export const nodeRegisterFs: RegisterFs = {
  exists: existsSync,
  readText: (path) => {
    try {
      return readFileSync(path, 'utf8')
    } catch {
      return null
    }
  },
  writeText: (path, content, mode) => {
    writeFileSync(path, content, 'utf8')
    if (mode !== undefined) chmodSync(path, mode)
  },
  mkdir: (path) => void mkdirSync(path, { recursive: true }),
}

export const runReg = (args: string[]): Promise<void> =>
  new Promise((resolve, reject) =>
    execFile('reg', args, { windowsHide: true }, (error) => (error ? reject(error) : resolve())),
  )
