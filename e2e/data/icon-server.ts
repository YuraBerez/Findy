import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'

/** A tiny valid PNG (1×1) */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

/**
 * Spec 011 NFR-003: stands in for the job sites, so tests never reach them. The app
 * reaches it through FINDY_SITE_ICONS_URL as `<url>/<host>/`. Each host in `hosts`
 * declares an icon on its home page; every other host has none (404).
 */
export class IconServer {
  private constructor(
    private readonly server: Server,
    readonly url: string,
    /** Paths asked, e.g. `/djinni.co/icon.png` */
    readonly requests: string[],
  ) {}

  static async start(hosts: readonly string[]): Promise<IconServer> {
    const requests: string[] = []
    const server = createServer((request, response) => {
      const path = request.url ?? '/'
      requests.push(path)
      const [, host, file] = /^\/([^/]+)\/(.*)$/.exec(path) ?? []
      if (!host || !hosts.includes(host)) return void response.writeHead(404).end()
      if (file === '')
        return void response
          .writeHead(200, { 'Content-Type': 'text/html' })
          .end('<html><head><link rel="icon" href="icon.png"></head></html>')
      if (file === 'icon.png')
        return void response.writeHead(200, { 'Content-Type': 'image/png' }).end(PNG)
      response.writeHead(404).end()
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const { port } = server.address() as AddressInfo
    return new IconServer(server, `http://127.0.0.1:${port}`, requests)
  }

  async close(): Promise<void> {
    this.server.closeAllConnections()
    await new Promise<void>((resolve) => this.server.close(() => resolve()))
  }
}
