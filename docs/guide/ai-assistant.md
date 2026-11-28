# Use Findy from an AI assistant

[Українською](ai-assistant.uk.md) · [Po polsku](ai-assistant.pl.md)

Connect Claude or another assistant to your board, and teach it how to use Findy.

## Use Findy from Claude or another AI assistant (MCP)

Findy has a built-in [MCP](https://modelcontextprotocol.io) server, so an assistant can
add, move and annotate applications when you ask it to ("I applied to Acme as a
frontend developer", "move Globex to the technical interview").

1. In Findy open **⋯ → Settings… → AI assistant** and turn on access (it is off by
default).
2. Copy the configuration it shows into your client:
   - **Claude Desktop / Cowork:** `claude_desktop_config.json` (Settings → Developer → Edit Config).
   - **Claude Code:** the `claude mcp add findy …` command from the same page.
   - **Gemini CLI, Cursor, VS Code, Windsurf, Zed, Codex CLI…:** the command, arguments
     and environment (`ELECTRON_RUN_AS_NODE=1`) from the page, transport stdio.
     The short form `<Findy> --mcp` also works.

Tools: list and get applications, list stages, add, update, move, add a note,
delete (the assistant asks you first). The same rules apply as in the app, and an
open Findy window shows the changes within a second.

**Privacy:** Findy itself sends your data nowhere. The assistant you connect sends
what it reads to its AI provider, and only when you ask it to work with your board.

To make the assistant use these tools well, also [install the Findy
skill](#install-the-findy-skill).

## Install the Findy skill

The Findy skill teaches your assistant how to work with your board: what each tool
does, the safe steps (no duplicates, no invented data, a delete only after you confirm)
and four typical tasks: add an application, update it after an interview, review your
job search, prepare for an interview. The skill needs the MCP connection above.

**Claude Code:** run one command in a terminal. It downloads the skill into
`~/.claude/skills/findy/`; Claude Code finds it at the next start. Run it again later to
update the skill.

macOS and Linux:

```bash
mkdir -p ~/.claude/skills/findy && curl -fsSL "https://raw.githubusercontent.com/YuraBerez/Findy/main/skills/findy/SKILL.md" -o ~/.claude/skills/findy/SKILL.md.tmp && mv ~/.claude/skills/findy/SKILL.md.tmp ~/.claude/skills/findy/SKILL.md
```

Windows (PowerShell):

```powershell
$d = "$HOME\.claude\skills\findy"; New-Item -ItemType Directory -Force $d | Out-Null; Invoke-WebRequest -UseBasicParsing "https://raw.githubusercontent.com/YuraBerez/Findy/main/skills/findy/SKILL.md" -OutFile "$d\SKILL.md.tmp"; if ($?) { Move-Item -Force "$d\SKILL.md.tmp" "$d\SKILL.md" }
```

**Claude Desktop and claude.ai:** in Findy, open **⋯ → Settings… → AI assistant** and
click **Save skill…**. Then open **Settings → Capabilities** in Claude, turn on skills if
they are off, and upload the saved `findy-skill-<version>.zip` in the **Skills** section.

**Other assistants that support Agent Skills:** use the command above with the skills
folder of your assistant instead of `~/.claude/skills`.

**Assistants without skills:** add the text of
[skills/findy/SKILL.md](../../skills/findy/SKILL.md) to the assistant's custom
instructions or
project rules.

The command takes the skill from the main branch. If the assistant reports an unknown
Findy tool, update Findy.


← [Back to README](../../README.md)
