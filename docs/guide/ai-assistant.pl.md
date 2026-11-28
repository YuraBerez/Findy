# Findy z asystentem AI

[English](ai-assistant.md) · [Українською](ai-assistant.uk.md)

Jak podłączyć Claude lub innego asystenta do Twojej tablicy i nauczyć go korzystać z Findy.

## Findy z Claude lub innym asystentem AI (MCP)

Findy ma wbudowany serwer [MCP](https://modelcontextprotocol.io), więc asystent może
dodawać i przenosić aplikacje oraz dopisywać do nich notatki, gdy go o to poprosisz
(„wysłałem aplikację do Acme na frontend developera”, „przenieś Globex na rozmowę
techniczną”).

1. W Findy otwórz **⋯ → Ustawienia… → Asystent AI** i włącz dostęp (domyślnie jest
wyłączony).
2. Skopiuj pokazaną konfigurację do swojego klienta:
   - **Claude Desktop / Cowork:** `claude_desktop_config.json` (Settings → Developer → Edit Config).
   - **Claude Code:** polecenie `claude mcp add findy …` z tej samej strony.
   - **Gemini CLI, Cursor, VS Code, Windsurf, Zed, Codex CLI…:** polecenie, argumenty
     i zmienna środowiskowa (`ELECTRON_RUN_AS_NODE=1`) ze strony, transport stdio.
     Krótka forma `<Findy> --mcp` też działa.

Narzędzia: lista i podgląd aplikacji, lista etapów, dodawanie, zmiana, przenoszenie,
notatka, usuwanie (asystent najpierw pyta Ciebie). Obowiązują te same zasady co w
aplikacji, a otwarte okno Findy pokazuje zmiany w ciągu sekundy.

**Prywatność:** samo Findy nigdzie nie wysyła Twoich danych. Podłączony asystent wysyła
to, co przeczyta, do swojego dostawcy AI, i tylko wtedy, gdy poprosisz go o pracę z Twoją
tablicą.

Aby asystent dobrze korzystał z tych narzędzi, [zainstaluj też umiejętność
Findy](#zainstaluj-umiejętność-findy).

## Zainstaluj umiejętność Findy

Umiejętność (skill) Findy uczy asystenta pracy z Twoją tablicą: co robi każde narzędzie,
bezpieczne kroki (bez duplikatów, bez wymyślonych danych, usuwanie tylko po Twoim
potwierdzeniu) i cztery typowe zadania: dodać aplikację, zaktualizować ją po rozmowie,
podsumować szukanie pracy, przygotować się do rozmowy. Umiejętność wymaga opisanego wyżej
połączenia MCP.

**Claude Code:** uruchom jedno polecenie w terminalu. Pobiera ono umiejętność do
`~/.claude/skills/findy/`; Claude Code znajdzie ją przy następnym uruchomieniu. Uruchom je
ponownie później, aby zaktualizować umiejętność.

macOS i Linux:

```bash
mkdir -p ~/.claude/skills/findy && curl -fsSL "https://raw.githubusercontent.com/YuraBerez/Findy/main/skills/findy/SKILL.md" -o ~/.claude/skills/findy/SKILL.md.tmp && mv ~/.claude/skills/findy/SKILL.md.tmp ~/.claude/skills/findy/SKILL.md
```

Windows (PowerShell):

```powershell
$d = "$HOME\.claude\skills\findy"; New-Item -ItemType Directory -Force $d | Out-Null; Invoke-WebRequest -UseBasicParsing "https://raw.githubusercontent.com/YuraBerez/Findy/main/skills/findy/SKILL.md" -OutFile "$d\SKILL.md.tmp"; if ($?) { Move-Item -Force "$d\SKILL.md.tmp" "$d\SKILL.md" }
```

**Claude Desktop i claude.ai:** w Findy otwórz **⋯ → Ustawienia… → Asystent AI** i
kliknij **Zapisz umiejętność…**. Potem w Claude otwórz **Settings → Capabilities**, włącz
umiejętności (skills), jeśli są wyłączone, i prześlij zapisany plik
`findy-skill-<wersja>.zip` w sekcji **Skills**.

**Inni asystenci z obsługą Agent Skills:** użyj polecenia powyżej, ale zamiast
`~/.claude/skills` podaj folder umiejętności swojego asystenta.

**Asystenci bez umiejętności:** dodaj tekst
[skills/findy/SKILL.md](../../skills/findy/SKILL.md) do własnych instrukcji asystenta
albo do reguł projektu.

Polecenie pobiera umiejętność z gałęzi main. Jeśli asystent zgłasza nieznane narzędzie
Findy, zaktualizuj Findy.


← [Wróć do README](../../README.pl.md)
