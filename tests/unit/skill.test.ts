// Spec 016: the skill for AI assistants
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createTools } from '../../src/main/mcp/tools'
import { STAGES } from '../../src/domain/stages'
import { memoryRepository } from './helpers/db'

const skill = readFileSync(join(__dirname, '../../skills/findy/SKILL.md'), 'utf8')

/** The `### name` headings between `## Tools` and the next `## ` heading */
function skillTools(text: string): string[] {
  const section = text.split(/^## /m).find((part) => part.startsWith('Tools\n')) ?? ''
  return [...section.matchAll(/^### (\S+)$/gm)].map((match) => match[1]!)
}

describe('skill (spec 016)', () => {
  it('describes exactly the MCP tools of this version (NFR-003, FR-002)', () => {
    const tools = createTools(memoryRepository().repository).map((tool) => tool.name)
    expect(skillTools(skill).sort()).toEqual(tools.sort())
  })

  it('names every stage id (FR-003)', () => {
    for (const stage of STAGES) expect(skill).toContain(`\`${stage}\``)
  })

  it('has the Agent Skills front matter: name findy and a description (FR-001)', () => {
    const front = /^---\n([\s\S]*?)\n---\n/.exec(skill)?.[1] ?? ''
    expect(front).toMatch(/^name: findy$/m)
    expect(front).toMatch(/^description: .{50,1024}$/m)
  })

  it('stays short enough to load whole (NFR-004)', () => {
    expect(skill.split('\n').length).toBeLessThanOrEqual(500)
  })
})
