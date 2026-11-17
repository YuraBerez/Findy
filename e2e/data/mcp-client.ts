import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import type { McpConnection } from '../../src/shared/ipc'

export interface ToolResult {
  isError: boolean
  text: string
  data: Record<string, unknown> | undefined
}

/** A real MCP client, as Claude Desktop would start Findy: `<app> --mcp` over stdio (spec 004). */
export class McpTestClient {
  private constructor(
    private readonly client: Client,
    private readonly transport: StdioClientTransport,
  ) {}

  /** `connection` is what the app shows the user to copy (FR-009) */
  static async start(connection: McpConnection, userDataDir: string): Promise<McpTestClient> {
    const client = new Client({ name: 'findy-e2e', version: '1.0.0' })
    const transport = new StdioClientTransport({
      command: connection.command,
      args: connection.args,
      env: {
        ...(process.env as Record<string, string>),
        ...connection.env,
        FINDY_USER_DATA_DIR: userDataDir,
      },
      stderr: 'pipe',
    })
    // Findy logs to stderr in MCP mode; show it when the connection fails
    let log = ''
    transport.stderr?.on('data', (chunk) => (log += String(chunk)))
    client.onclose = () => {
      if (log && !closing.has(client))
        console.log(`Findy --mcp closed the connection. Its stderr:\n${log}`)
    }
    await client.connect(transport)
    return new McpTestClient(client, transport)
  }

  async tools(): Promise<{ name: string; annotations?: Record<string, unknown> }[]> {
    return (await this.client.listTools()).tools
  }

  async call(name: string, args: Record<string, unknown> = {}): Promise<ToolResult> {
    const result = await this.client.callTool({ name, arguments: args })
    const content = result.content as { type: string; text: string }[]
    return {
      isError: result.isError === true,
      text: content[0]?.text ?? '',
      data: result.structuredContent as Record<string, unknown> | undefined,
    }
  }

  /** Closes the connection and waits until `Findy --mcp` has exited (it holds the database) */
  async close(): Promise<void> {
    const pid = this.transport.pid
    closing.add(this.client)
    await this.client.close()
    if (pid === null) return
    const deadline = Date.now() + 5_000
    while (Date.now() < deadline && isRunning(pid))
      await new Promise((resolve) => setTimeout(resolve, 50))
  }
}

/** Clients closed by the test, not by Findy */
const closing = new WeakSet<Client>()

function isRunning(pid: number): boolean {
  try {
    process.kill(pid, 0) // signal 0 only checks that the process exists
    return true
  } catch {
    return false
  }
}
