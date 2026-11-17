import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import { HiddenStageError, NotFoundError, type Repository } from '../db/repository'
import { createTools, McpAccessDisabledError } from './tools'

/** Message an assistant can act on; never a stack trace (spec 004 FR-008) */
export function toolErrorMessage(error: unknown): string {
  if (error instanceof McpAccessDisabledError || error instanceof HiddenStageError)
    return error.message
  if (error instanceof NotFoundError)
    return `${error.message}. Use list_applications to get current ids.`
  return `Findy could not do this: ${error instanceof Error ? error.message : String(error)}`
}

/**
 * stdio transport that also closes when the client closes our stdin. The SDK one
 * waits for data only, so the server would stay alive until the client kills it (FR-001).
 */
export function stdioTransport(
  stdin: NodeJS.ReadableStream = process.stdin,
  stdout: NodeJS.WritableStream = process.stdout,
): Transport {
  const transport = new StdioServerTransport(stdin as never, stdout as never)
  stdin.once('end', () => void transport.close())
  return transport
}

/**
 * Serves the tools over stdio until the client closes the connection (FR-001).
 * `repository` is null when the database cannot be opened: every tool then
 * explains that, and the file is not touched (001 FR-054).
 */
export async function runMcpServer(
  repository: Repository | null,
  version: string,
  storageProblem: string,
  /** stdio for real clients; an in-memory transport in tests */
  transport: Transport = stdioTransport(),
): Promise<void> {
  const server = new McpServer({ name: 'findy', title: 'Findy job-search board', version })

  if (repository) {
    for (const tool of createTools(repository)) {
      server.registerTool(
        tool.name,
        {
          title: tool.title,
          description: tool.description,
          inputSchema: tool.inputSchema,
          annotations: tool.annotations,
        },
        async (args: Record<string, unknown>) => {
          try {
            const result = tool.run(args as never)
            return {
              content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
              structuredContent: result,
            }
          } catch (error) {
            return {
              isError: true,
              content: [{ type: 'text' as const, text: toolErrorMessage(error) }],
            }
          }
        },
      )
    }
  } else {
    server.registerTool(
      'list_stages',
      {
        title: 'List stages',
        description: 'Findy cannot open its database.',
        annotations: { readOnlyHint: true },
      },
      async () => ({ isError: true, content: [{ type: 'text' as const, text: storageProblem }] }),
    )
  }

  const closed = new Promise<void>((resolve) => {
    transport.onclose = () => resolve()
  })
  await server.connect(transport)
  await closed
}
