// Spec 017: the one-line command that installs the skill into Claude Code.
import { SKILL_RAW_URL } from './project'

export type CommandShell = 'posix' | 'powershell'

/**
 * FR-001…FR-003: download to a temporary file and move it over `SKILL.md` only after a
 * good download, so a failure keeps the old skill. Folders are created as needed.
 */
export function skillInstallCommand(shell: CommandShell, url: string = SKILL_RAW_URL): string {
  if (shell === 'powershell')
    return [
      `$d = "$HOME\\.claude\\skills\\findy"`,
      'New-Item -ItemType Directory -Force $d | Out-Null',
      // -UseBasicParsing: Windows PowerShell 5.1 would use Internet Explorer otherwise
      `Invoke-WebRequest -UseBasicParsing "${url}" -OutFile "$d\\SKILL.md.tmp"`,
      'if ($?) { Move-Item -Force "$d\\SKILL.md.tmp" "$d\\SKILL.md" }',
    ].join('; ')
  const dir = '~/.claude/skills/findy'
  return (
    `mkdir -p ${dir} && curl -fsSL "${url}" -o ${dir}/SKILL.md.tmp && ` +
    `mv ${dir}/SKILL.md.tmp ${dir}/SKILL.md`
  )
}
