import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Spec 019: the folder that holds the host manifest of Chrome inside a test home */
export function chromeProfileDir(home: string): string | null {
  if (process.platform === 'darwin')
    return join(home, 'Library', 'Application Support', 'Google', 'Chrome')
  if (process.platform === 'linux') return join(home, '.config', 'google-chrome')
  return null // Windows: registry keys, which a test run does not write
}

/** The manifest that the app wrote for Chrome, or null on Windows */
export function chromeHostManifest(home: string): Record<string, unknown> | null {
  const profile = chromeProfileDir(home)
  if (!profile) return null
  return JSON.parse(
    readFileSync(join(profile, 'NativeMessagingHosts', 'io.github.findy.json'), 'utf8'),
  ) as Record<string, unknown>
}

/**
 * Talks to Findy as the browser does (spec 019, docs/contracts/native-messaging.md): it
 * starts the launcher that the app registered and sends one framed message per start.
 */
export class BrowserConnector {
  private constructor(readonly launcher: string) {}

  /** Waits until the app has written the launcher into its data folder (FR-011) */
  static async registered(userDataDir: string): Promise<BrowserConnector> {
    const name = process.platform === 'win32' ? 'findy-connector.cmd' : 'findy-connector.sh'
    const launcher = join(userDataDir, 'connector', name)
    const deadline = Date.now() + 10_000
    while (!existsSync(launcher)) {
      if (Date.now() > deadline) throw new Error(`Findy did not write ${launcher}`)
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    return new BrowserConnector(launcher)
  }

  send(message: object): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      // A .cmd file runs only through the shell, as Chrome starts it
      const child = spawn(this.launcher, [], {
        shell: process.platform === 'win32',
        stdio: ['pipe', 'pipe', 'pipe'],
      })
      const chunks: Buffer[] = []
      let log = ''
      child.stdout.on('data', (chunk: Buffer) => chunks.push(chunk))
      child.stderr.on('data', (chunk) => (log += String(chunk)))
      child.on('error', reject)
      child.on('close', () => {
        const output = Buffer.concat(chunks)
        if (output.length < 4) return reject(new Error(`No answer from the connector. ${log}`))
        resolve(JSON.parse(output.subarray(4, 4 + output.readUInt32LE(0)).toString('utf8')))
      })
      const body = Buffer.from(JSON.stringify(message), 'utf8')
      const header = Buffer.alloc(4)
      header.writeUInt32LE(body.length, 0)
      child.stdin.end(Buffer.concat([header, body]))
    })
  }
}
