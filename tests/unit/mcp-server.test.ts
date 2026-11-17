import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { describe, expect, it } from 'vitest'
import { HiddenStageError, NotFoundError, type Repository } from '../../src/main/db/repository'
import { runMcpServer, toolErrorMessage } from '../../src/main/mcp/server'
import { McpAccessDisabledError } from '../../src/main/mcp/tools'
import { memoryRepository } from './helpers/db'

/** A real MCP client talking to the server over an in-memory transport */
async function connect(repository: Repository | null) {
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()
  const running = runMcpServer(repository, '9.9.9', 'Findy cannot open its database.', serverSide)
  const client = new Client({ name: 'test', version: '1' })
  await client.connect(clientSide)
  return {
    client,
    close: async () => {
      await client.close()
      await running // resolves when the transport closes (FR-001)
    },
  }
}

const text = (result: Awaited<ReturnType<Client['callTool']>>) =>
  (result.content as { type: string; text: string }[])[0]!.text

describe('MCP server (spec 004)', () => {
  it('lists the tools with descriptions, schemas and annotations', async () => {
    const { repository } = memoryRepository()
    const { client, close } = await connect(repository)
    expect(client.getServerVersion()).toMatchObject({ name: 'findy', version: '9.9.9' })
    const { tools } = await client.listTools()
    expect(tools).toHaveLength(8)
    const remove = tools.find((tool) => tool.name === 'delete_application')!
    expect(remove.annotations).toMatchObject({ destructiveHint: true })
    expect(tools.find((tool) => tool.name === 'add_application')!.inputSchema.required).toEqual([
      'title',
      'company',
    ])
    await close()
  })

  it('answers with structured content, and errors as tool errors (FR-008)', async () => {
    const { repository } = memoryRepository()
    const { client, close } = await connect(repository)

    const off = await client.callTool({ name: 'list_applications', arguments: {} })
    expect(off.isError).toBe(true)
    expect(text(off)).toMatch(/AI assistant access/)

    repository.setMcpEnabled(true)
    const added = await client.callTool({
      name: 'add_application',
      arguments: { title: 'Frontend Developer', company: 'Acme' },
    })
    expect(added.isError).toBeFalsy()
    expect(added.structuredContent).toMatchObject({
      application: { title: 'Frontend Developer', stage: 'applied' },
    })
    expect(JSON.parse(text(added))).toEqual(added.structuredContent)

    const missing = await client.callTool({
      name: 'get_application',
      arguments: { id: '00000000-0000-4000-8000-000000000999' },
    })
    expect(missing.isError).toBe(true)
    expect(text(missing)).toMatch(/Use list_applications/)

    const invalid = await client.callTool({
      name: 'add_application',
      arguments: { title: '', company: 'x' },
    })
    expect(invalid.isError).toBe(true)
    await close()
  })

  it('explains a database that cannot be opened (001 FR-054)', async () => {
    const { client, close } = await connect(null)
    const result = await client.callTool({ name: 'list_stages', arguments: {} })
    expect(result.isError).toBe(true)
    expect(text(result)).toBe('Findy cannot open its database.')
    await close()
  })
})

describe('toolErrorMessage', () => {
  it('passes rule messages, guides on unknown ids, wraps the rest', () => {
    expect(toolErrorMessage(new McpAccessDisabledError())).toMatch(/turned off/)
    expect(toolErrorMessage(new HiddenStageError('offered'))).toMatch(/"offered" is hidden/)
    expect(toolErrorMessage(new NotFoundError('Application', 'x'))).toMatch(/list_applications/)
    expect(toolErrorMessage(new Error('disk full'))).toBe('Findy could not do this: disk full')
    expect(toolErrorMessage('odd')).toBe('Findy could not do this: odd')
  })
})
