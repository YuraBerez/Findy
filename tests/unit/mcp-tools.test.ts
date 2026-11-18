import { beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { HiddenStageError, NotFoundError, type Repository } from '../../src/main/db/repository'
import { createTools, McpAccessDisabledError, type ToolDefinition } from '../../src/main/mcp/tools'
import { memoryRepository } from './helpers/db'

let repo: Repository
let tools: Map<string, ToolDefinition>

/** Parses arguments with the tool's own schema, as the SDK does, then runs it */
const call = (name: string, args: Record<string, unknown> = {}) => {
  const tool = tools.get(name)!
  return tool.run(z.object(tool.inputSchema).parse(args))
}

beforeEach(() => {
  ;({ repository: repo } = memoryRepository())
  tools = new Map(createTools(repo).map((tool) => [tool.name, tool]))
})

describe('MCP tools (spec 004)', () => {
  it('exposes exactly the eight tools of FR-002 with their annotations (FR-004)', () => {
    expect([...tools.keys()].sort()).toEqual([
      'add_application',
      'add_note',
      'delete_application',
      'get_application',
      'list_applications',
      'list_stages',
      'move_application',
      'update_application',
    ])
    expect(tools.get('list_applications')!.annotations.readOnlyHint).toBe(true)
    expect(tools.get('delete_application')!.annotations.destructiveHint).toBe(true)
    expect(tools.get('add_application')!.annotations.readOnlyHint).toBeUndefined()
  })

  it('every tool refuses while access is off (FR-005, US-1.2)', () => {
    // The gate comes before any work, whatever the (already validated) arguments are
    for (const [name, tool] of tools) {
      expect(() => tool.run({} as never), name).toThrow(McpAccessDisabledError)
    }
    expect(new McpAccessDisabledError().message).toMatch(/AI assistant access/)
  })

  describe('with access on', () => {
    beforeEach(() => {
      repo.setMcpEnabled(true)
    })

    it('adds, lists, gets, moves, updates, notes and deletes (US-2, US-3, US-5)', () => {
      const added = call('add_application', {
        title: ' Frontend Developer ',
        company: 'Acme',
        url: 'https://acme.com/1',
      }) as {
        application: { id: string; title: string; stage: string }
      }
      const { id } = added.application
      expect(added.application).toMatchObject({ title: 'Frontend Developer', stage: 'applied' })

      expect(call('list_applications', { query: 'acm' })).toMatchObject({
        applications: [{ id, company: 'Acme', stageName: 'Applied', notes: 0 }],
      })
      expect(call('list_applications', { stage: 'offered' })).toEqual({ applications: [] })

      expect(call('move_application', { id, stage: 'hr_interview' })).toMatchObject({
        application: {
          stage: 'hr_interview',
          stageHistory: [
            { stage: 'applied' },
            { stage: 'hr_interview', stageName: 'HR interview' },
          ],
        },
      })
      expect(call('update_application', { id, company: 'Globex' })).toMatchObject({
        application: { company: 'Globex' },
      })
      expect(call('add_note', { id, text: 'Call on Friday' })).toMatchObject({
        application: { notes: [{ text: 'Call on Friday' }] },
      })
      expect(call('get_application', { id })).toMatchObject({
        application: { id, url: 'https://acme.com/1' },
      })

      expect(call('delete_application', { id })).toEqual({
        deleted: { id, title: 'Frontend Developer', company: 'Globex' },
      })
      expect(call('list_applications')).toEqual({ applications: [] })
    })

    it('lists stages in order with the hidden flag', () => {
      repo.setHiddenStages(['rejected'])
      const { stages } = call('list_stages') as { stages: { id: string; hidden: boolean }[] }
      expect(stages.map((stage) => stage.id)).toEqual([
        'applied',
        'hr_interview',
        'test_task',
        'technical_interview',
        'c_level_interview',
        'offered',
        'rejected',
      ])
      expect(stages.at(-1)).toEqual({ id: 'rejected', name: 'Rejected', hidden: true })
    })

    it('uses the same rules as the app (FR-003, US-2.4)', () => {
      const tool = tools.get('add_application')!
      const schema = z.object(tool.inputSchema)
      expect(schema.safeParse({ title: '', company: 'x' }).success).toBe(false)
      expect(
        schema.safeParse({ title: 'a', company: 'b', url: 'javascript:alert(1)' }).success,
      ).toBe(false)
      expect(schema.safeParse({ title: 'a', company: 'b', stage: 'hired' }).success).toBe(false)

      repo.setHiddenStages(['offered'])
      expect(() => call('add_application', { title: 'a', company: 'b', stage: 'offered' })).toThrow(
        HiddenStageError,
      )
    })

    it('neither shows nor changes the card colour (spec 007 D-4)', () => {
      const { id } = repo.createApplication({ title: 'Dev', company: 'Acme', url: null })
      repo.setApplicationColor(id, 'red')
      expect(z.object(tools.get('update_application')!.inputSchema).shape).not.toHaveProperty(
        'color',
      )
      call('update_application', { id, color: null, title: 'Lead' })
      expect(repo.getApplication(id)).toMatchObject({ title: 'Lead', color: 'red' })
      expect(call('get_application', { id })).not.toHaveProperty('application.color')
    })

    it('reports unknown ids', () => {
      expect(() => call('get_application', { id: '00000000-0000-4000-8000-000000000999' })).toThrow(
        NotFoundError,
      )
    })
  })
})
