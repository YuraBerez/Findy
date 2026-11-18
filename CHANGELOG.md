# Changelog

All notable changes to Findy. Versions follow [SemVer](https://semver.org/);
pre-1.0 releases can change behaviour between minor versions.

## [0.2.0] - 2026-11-18

### Analytics
- A new **Analytics** tab next to **Board** (Cmd/Ctrl+1 and Cmd/Ctrl+2 switch between them).
- **Applications sent** per day, week or month, and **Stages over time**: how many HR, test-task, technical and C-level interviews, offers and rejections you had. Turn stages on and off in the legend.
- A **funnel**: how many applications of the period reached each stage, with percentages, and the totals at the top.
- Periods: last 7, 30, 90 days or all time. Hover a bar or use the arrow keys to see its value; every chart can show its numbers as a table.
- Everything is calculated on your computer from the data that Findy already keeps.

### Update check
- **⋯ → Check for updates…** tells you if a newer version is on GitHub and opens its download page.
- **⋯ → Check for updates automatically** checks at start, at most once a day. It is **off by default**: Findy makes no network request until you check or turn it on, and the check sends no data.

## [0.1.1] - 2026-11-17

### Fixed
- **macOS:** the downloaded app no longer shows *"Findy" is damaged and can't be opened* on Apple Silicon. The whole app bundle is now signed ad hoc, so macOS shows the usual unknown-developer warning, and **System Settings → Privacy & Security → Open Anyway** opens Findy. See [First start](https://github.com/YuraBerez/findy#first-start-the-builds-are-not-signed-yet).

### Changed
- The macOS downloads are named `…-macOS-Apple-Silicon.dmg` and `…-macOS-Intel.dmg`, and the release notes start with a table that tells which file to download.

## [0.1.0] - 2026-11-17

The first release: a private, local-first kanban board for your job search.

### Board
- Seven stages from **Applied** to **Offer** / **Rejected**; drag-and-drop with the mouse or the keyboard, also backwards and into empty columns; a **Move to…** menu on every card.
- Add applications with a title, company, vacancy link and stage; cards show the note count and how long they are in their stage; a link button opens the vacancy in your browser.
- Search by title or company (Cmd/Ctrl+F).
- Hide columns you do not use (**⋯ → Columns…**); nothing can be moved into a hidden column.
- **Reset board** with a confirmation and an automatic backup of your data.

### Details and notes
- A details panel: edit the application, stage history as a timeline, notes (add, edit, delete), delete the application.

### Comfort
- English and Ukrainian, including the native menu; light and dark theme; both in the **⋯** menu.
- Clear messages when something cannot be saved, and a **Found an issue?** button.

### AI assistants (MCP)
- A built-in MCP server: Claude Desktop, Cowork, Claude Code, Gemini CLI, Cursor and other MCP clients can read and change the board when you ask them. Off by default; **⋯ → AI assistant access (MCP)…** turns it on and shows the configuration to copy. Works on Windows, macOS and Linux.

### Data and privacy
- All data in a local SQLite database; no account, no telemetry; Findy makes no network requests.
- Damaged or newer databases are kept and copied aside, never overwritten; backups before migrations and resets.

### Downloads
- Windows (x64) installer, macOS (Apple Silicon and Intel) disk images, Linux AppImage and `.deb`.
- The builds are **not code-signed** yet. The first time you open Findy, macOS and Windows show a warning: see [First start](https://github.com/YuraBerez/findy#first-start-the-builds-are-not-signed-yet) in the README for the steps.
