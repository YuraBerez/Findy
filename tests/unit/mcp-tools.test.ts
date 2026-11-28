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

    it('spec 014 FR-044: reads and writes the extra fields; the source as text', () => {
      const salary = { min: 3000, max: 4000, currency: 'EUR', period: 'month' }
      const added = call('add_application', {
        title: 'Dev',
        company: 'Acme',
        url: 'https://djinni.co/jobs/1/',
        salary,
        workFormat: 'remote',
      }) as { application: { id: string } }
      const { id } = added.application
      expect(added.application).toMatchObject({ salary, workFormat: 'remote', source: 'Djinni' })

      const updated = call('update_application', {
        id,
        source: 'Referral',
        location: 'Lviv',
        contactName: 'Olena',
        salary: null,
      }) as { application: Record<string, unknown> }
      expect(updated.application).toMatchObject({
        source: 'Referral',
        location: 'Lviv',
        contactName: 'Olena',
        salary: null,
        workFormat: 'remote',
      })
      expect(call('update_application', { id, source: 'Acme careers' })).toMatchObject({
        application: { source: 'Acme careers' },
      })
      expect(call('update_application', { id, source: null })).toMatchObject({
        application: { source: null },
      })
      expect(call('update_application', { id, source: '  ' })).toMatchObject({
        application: { source: null },
      })
      expect(call('list_applications', { query: 'lviv' })).toMatchObject({
        applications: [{ id }],
      })
      expect(() =>
        call('update_application', {
          id,
          salary: { min: 5, max: 1, currency: 'EUR', period: 'month' },
        }),
      ).toThrow()
      expect(() => call('update_application', { id, source: 'x'.repeat(61) })).toThrow()
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

    it('spec 025: adds, changes, keeps, clears and reads the card colour (FR-001…FR-004)', () => {
      const added = call('add_application', { title: 'Dev', company: 'Acme', color: 'green' }) as {
        application: { id: string; color: string | null }
      }
      const { id } = added.application
      expect(added.application.color).toBe('green')
      expect(call('update_application', { id, title: 'Lead' })).toMatchObject({
        application: { title: 'Lead', color: 'green' },
      })
      call('update_application', { id, color: 'red' })
      expect(call('list_applications')).toMatchObject({ applications: [{ id, color: 'red' }] })
      call('update_application', { id, color: null })
      expect(call('get_application', { id })).toMatchObject({ application: { color: null } })
    })

    it('spec 025: an unknown colour names the allowed ones and changes nothing (FR-004, FR-005)', () => {
      const { id } = repo.createApplication({ title: 'Dev', company: 'Acme', url: null })
      expect(() => call('update_application', { id, title: 'Lead', color: 'pink' })).toThrow(
        /red.*orange.*yellow.*green.*blue.*purple.*grey/s,
      )
      expect(repo.getApplication(id)).toMatchObject({ title: 'Dev', color: null })
      const color = z.object(tools.get('update_application')!.inputSchema).shape.color as z.ZodType
      expect(color.description).toContain('red, orange, yellow, green, blue, purple, grey')
    })

    it('reports unknown ids', () => {
      expect(() => call('get_application', { id: '00000000-0000-4000-8000-000000000999' })).toThrow(
        NotFoundError,
      )
    })
  })
})

describe('next step in the MCP tools (spec 015 FR-054)', () => {
  beforeEach(() => {
    repo.setMcpEnabled(true)
  })

  it('sets, returns, finds and clears the step', () => {
    const { application } = call('add_application', {
      title: 'Dev',
      company: 'Acme',
      nextStep: { text: 'HR call', date: '2026-11-24', time: '11:00' },
    }) as { application: { id: string; nextStep: unknown } }
    expect(application.nextStep).toEqual({ text: 'HR call', date: '2026-11-24', time: '11:00' })

    const listed = call('list_applications', { query: 'hr call' }) as {
      applications: { nextStep: unknown }[]
    }
    expect(listed.applications.map((app) => app.nextStep)).toEqual([application.nextStep])

    const updated = call('update_application', { id: application.id, nextStep: null }) as {
      application: { nextStep: unknown }
    }
    expect(updated.application.nextStep).toBeNull()
  })

  it('rejects a step with a bad date', () => {
    expect(() =>
      call('add_application', {
        title: 'Dev',
        company: 'Acme',
        nextStep: { text: 'HR call', date: 'Tuesday' },
      }),
    ).toThrow()
  })
})
