# Findy з AI-асистентом

[English](ai-assistant.md)

Як підключити Claude чи іншого асистента до дошки й навчити його працювати з Findy.

## Findy з Claude чи іншим AI-асистентом (MCP)

У Findy вбудований [MCP](https://modelcontextprotocol.io)-сервер: асистент може
додавати, переміщувати й коментувати заявки на ваше прохання («я відгукнувся в Acme
на фронтенд», «перемісти Globex на технічну співбесіду»).

1. У Findy відкрийте **⋯ → Налаштування… → AI-асистент** і ввімкніть доступ (за
замовчуванням вимкнено).
2. Скопіюйте показані налаштування у свій клієнт:
   - **Claude Desktop / Cowork:** `claude_desktop_config.json` (Settings → Developer → Edit Config).
   - **Claude Code:** команда `claude mcp add findy …` з тієї самої сторінки.
   - **Gemini CLI, Cursor, VS Code, Windsurf, Zed, Codex CLI…:** команда, аргументи
     й змінна середовища (`ELECTRON_RUN_AS_NODE=1`) зі сторінки, транспорт stdio.
     Коротка форма `<Findy> --mcp` теж працює.

Інструменти: список і перегляд заявок, список етапів, додати, змінити, перемістити,
нотатка, видалити (асистент спершу питає вас). Правила ті самі, що в застосунку, а
відкрите вікно Findy показує зміни протягом секунди.

**Приватність:** сам Findy нікуди не передає ваші дані. Підключений асистент передає
прочитане своєму AI-провайдеру — лише коли ви просите його попрацювати з дошкою.

Щоб асистент користувався цими інструментами правильно, також
[встановіть скіл Findy](#встановити-скіл-findy).

## Встановити скіл Findy

Скіл Findy навчає асистента працювати з вашою дошкою: що робить кожен інструмент,
безпечні кроки (без дублікатів, без вигаданих даних, видалення лише після вашого
підтвердження) і чотири типові задачі: додати заявку, оновити її після співбесіди,
підсумувати пошук, підготуватися до співбесіди. Скілу потрібне MCP-підключення, описане
вище.

**Claude Code:** виконайте одну команду в терміналі. Вона завантажить скіл у
`~/.claude/skills/findy/`; Claude Code знайде його під час наступного запуску. Повторний
запуск команди оновить скіл.

macOS і Linux:

```bash
mkdir -p ~/.claude/skills/findy && curl -fsSL "https://raw.githubusercontent.com/YuraBerez/Findy/main/skills/findy/SKILL.md" -o ~/.claude/skills/findy/SKILL.md.tmp && mv ~/.claude/skills/findy/SKILL.md.tmp ~/.claude/skills/findy/SKILL.md
```

Windows (PowerShell):

```powershell
$d = "$HOME\.claude\skills\findy"; New-Item -ItemType Directory -Force $d | Out-Null; Invoke-WebRequest -UseBasicParsing "https://raw.githubusercontent.com/YuraBerez/Findy/main/skills/findy/SKILL.md" -OutFile "$d\SKILL.md.tmp"; if ($?) { Move-Item -Force "$d\SKILL.md.tmp" "$d\SKILL.md" }
```

**Claude Desktop і claude.ai:** у Findy відкрийте **⋯ → Налаштування… → AI-асистент** і
натисніть **Зберегти скіл…**. Потім у Claude відкрийте **Settings → Capabilities**,
увімкніть скіли, якщо вони вимкнені, і завантажте збережений `findy-skill-<версія>.zip` у
розділі **Skills**.

**Інші асистенти з підтримкою Agent Skills:** скористайтеся командою вище, замінивши
`~/.claude/skills` на теку скілів вашого асистента.

**Асистенти без скілів:** додайте текст
[skills/findy/SKILL.md](../../skills/findy/SKILL.md) до
власних інструкцій асистента або правил проєкту.

Команда бере скіл з гілки main. Якщо асистент повідомляє про невідомий інструмент Findy,
оновіть Findy.


← [Назад до README](../../README.uk.md)
