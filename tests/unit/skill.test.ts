// Spec 016: the skill for AI assistants
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { inflateRawSync } from 'node:zlib'
import { describe, expect, it, vi } from 'vitest'
import { createSkillSaver, skillArchive, skillArchiveName } from '../../src/main/skill'
import { zip } from '../../src/main/skill/zip'
import { SKILL_RAW_URL } from '../../src/shared/project'
import { skillInstallCommand } from '../../src/shared/skill'
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

/** The entries of a zip from its central directory (a reader for the test only) */
function readZip(bytes: Uint8Array): { path: string; data: string; method: number }[] {
  const buffer = Buffer.from(bytes)
  const end = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]))
  const count = buffer.readUInt16LE(end + 10)
  let at = buffer.readUInt32LE(end + 16)
  const entries = []
  for (let i = 0; i < count; i++) {
    expect(buffer.readUInt32LE(at)).toBe(0x02014b50)
    const method = buffer.readUInt16LE(at + 10)
    const size = buffer.readUInt32LE(at + 20)
    const nameLength = buffer.readUInt16LE(at + 28)
    const offset = buffer.readUInt32LE(at + 42)
    const path = buffer.toString('utf8', at + 46, at + 46 + nameLength)
    expect(buffer.readUInt32LE(offset)).toBe(0x04034b50)
    const start = offset + 30 + buffer.readUInt16LE(offset + 26)
    const raw = buffer.subarray(start, start + size)
    entries.push({
      path,
      method,
      data: (method === 8 ? inflateRawSync(raw) : raw).toString('utf8'),
    })
    at += 46 + nameLength
  }
  return entries
}

describe('skill archive (FR-010, FR-012)', () => {
  it('has the findy folder at the root with SKILL.md, stored, with the right CRC', () => {
    const entries = readZip(skillArchive(skill))
    expect(entries.map((entry) => entry.path)).toEqual(['findy/', 'findy/SKILL.md'])
    expect(entries[1]!.data).toBe(skill)
    expect(entries.every((entry) => entry.method === 0)).toBe(true)
  })

  it('keeps UTF-8 names and text; the same input gives the same bytes', () => {
    const files = [{ path: 'тека/файл.md', data: new TextEncoder().encode('Привіт — ʼ') }]
    expect(readZip(zip(files))).toEqual([{ path: 'тека/файл.md', data: 'Привіт — ʼ', method: 0 }])
    expect(zip(files)).toEqual(zip(files))
  })

  it('an empty archive is valid', () => {
    expect(readZip(zip([]))).toEqual([])
  })

  it('the CRC matches the data', () => {
    const bytes = Buffer.from(zip([{ path: 'a.txt', data: new TextEncoder().encode('abc') }]))
    // CRC-32 of "abc"
    expect(bytes.readUInt32LE(14)).toBe(0x352441c2)
  })
})

describe('skill saver (FR-021)', () => {
  const deps = (path: string | null) => ({
    version: '0.6.0',
    skillText: skill,
    pickSavePath: vi.fn(async () => path),
    writeBytes: vi.fn(async () => {}),
  })

  it('proposes the versioned name and writes the archive', async () => {
    const d = deps('/tmp/x.zip')
    expect(await createSkillSaver(d).save()).toEqual({ status: 'saved' })
    expect(d.pickSavePath).toHaveBeenCalledWith('findy-skill-0.6.0.zip')
    expect(skillArchiveName('1.2.3')).toBe('findy-skill-1.2.3.zip')
    expect(d.writeBytes).toHaveBeenCalledWith('/tmp/x.zip', skillArchive(skill))
  })

  it('a cancel writes nothing', async () => {
    const d = deps(null)
    expect(await createSkillSaver(d).save()).toEqual({ status: 'cancelled' })
    expect(d.writeBytes).not.toHaveBeenCalled()
  })
})

describe('install command (spec 017)', () => {
  it('posix: one line, the main branch file, a temp file moved only after a good download', () => {
    const command = skillInstallCommand('posix')
    expect(command).not.toContain('\n')
    expect(command).toContain(`"${SKILL_RAW_URL}"`)
    expect(SKILL_RAW_URL).toMatch(
      /^https:\/\/raw\.githubusercontent\.com\/.+\/main\/skills\/findy\/SKILL\.md$/,
    )
    expect(command).toBe(
      'mkdir -p ~/.claude/skills/findy && curl -fsSL "' +
        SKILL_RAW_URL +
        '" -o ~/.claude/skills/findy/SKILL.md.tmp && ' +
        'mv ~/.claude/skills/findy/SKILL.md.tmp ~/.claude/skills/findy/SKILL.md',
    )
  })

  it('PowerShell: one line, quoted paths (spaces in the home folder), move only on success', () => {
    const command = skillInstallCommand('powershell', 'https://example.com/SKILL.md')
    expect(command).not.toContain('\n')
    expect(command).toBe(
      '$d = "$HOME\\.claude\\skills\\findy"; ' +
        'New-Item -ItemType Directory -Force $d | Out-Null; ' +
        'Invoke-WebRequest -UseBasicParsing "https://example.com/SKILL.md" -OutFile "$d\\SKILL.md.tmp"; ' +
        'if ($?) { Move-Item -Force "$d\\SKILL.md.tmp" "$d\\SKILL.md" }',
    )
  })
})
