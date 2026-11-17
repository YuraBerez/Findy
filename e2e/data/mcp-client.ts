import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import electron from 'electron'

// Outside Electron, the `electron` package exports the path to its binary
const electronBinary = electron as unknown as string

export interface ToolResult {
  isError: boolean
  text: string
  data: Record<string, unknown> | undefined
}

/** A real MCP client, as Claude Desktop would start Findy: `<app> --mcp` over stdio (spec 004). */
export class McpTestClient {
  private constructor(private readonly client: Client) {}

  static async start(userDataDir: string): Promise<McpTestClient> {
    const args = ['.', '--mcp']
    if (process.env.CI && process.platform === 'linux') args.push('--no-sandbox')
    const client = new Client({ name: 'findy-e2e', version: '1.0.0' })
    await client.connect(
      new StdioClientTransport({
        command: electronBinary,
        args,
        env: { ...(process.env as Record<string, string>), FINDY_USER_DATA_DIR: userDataDir },
        stderr: 'ignore',
      }),
    )
    return new McpTestClient(client)
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

  close(): Promise<void> {
    return this.client.close()
  }
}
