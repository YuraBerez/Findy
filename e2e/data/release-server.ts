import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'

export interface FakeRelease {
  /** Tag of the latest release, e.g. "v9.0.0" */
  tag: string
  /** Answer with this HTTP status instead of the release (e.g. 500) */
  status?: number
}

/**
 * A local stand-in for the GitHub "latest release" API (spec 006, plan D-4). The app
 * reaches it through FINDY_RELEASES_URL; the test reads how many requests came (SC-001).
 */
export class ReleaseServer {
  private constructor(
    private readonly server: Server,
    readonly url: string,
    private readonly counter: { requests: number },
  ) {}

  static async start(release: FakeRelease): Promise<ReleaseServer> {
    const counter = { requests: 0 }
    const server = createServer((_request, response) => {
      counter.requests++
      if (release.status) {
        response.writeHead(release.status).end('{"message":"simulated"}')
        return
      }
      response.writeHead(200, { 'Content-Type': 'application/json' }).end(
        JSON.stringify({
          tag_name: release.tag,
          html_url: `https://github.com/YuraBerez/findy/releases/tag/${release.tag}`,
          draft: false,
          prerelease: false,
        }),
      )
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const { port } = server.address() as AddressInfo
    return new ReleaseServer(server, `http://127.0.0.1:${port}/latest`, counter)
  }

  requests(): number {
    return this.counter.requests
  }

  pageOf(tag: string): string {
    return `https://github.com/YuraBerez/findy/releases/tag/${tag}`
  }

  async close(): Promise<void> {
    await new Promise((resolve) => this.server.close(resolve))
  }
}
