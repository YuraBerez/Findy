# Changelog

All notable changes to Findy. Versions follow [SemVer](https://semver.org/);
pre-1.0 releases can change behaviour between minor versions.

## [0.7.0] - 2026-11-22

### Add a vacancy from the browser
- The new Findy browser extension adds the vacancy that you see to your board in one click. On a vacancy page, click the Findy button (or press **Alt+Shift+F**), check the job title and the company, and click **Add to Findy**. The application goes to **Applied**.
- It works also on pages that need a login, for example LinkedIn, because it reads the page as you see it.
- If you already added the vacancy, the extension shows its stage, and **Add anyway** adds it again.
- The extension talks only to the Findy app on your computer. It makes no network requests and keeps no copy of the page. Findy registers itself with Chrome, Edge, Brave, Opera, Vivaldi, Chromium and Firefox when it starts.
- The extension is not in the browser stores yet. Download `Findy-0.7.0-browser-extension.zip` from this release and load it in your browser: see [docs/guide/browser-extension.md](https://github.com/YuraBerez/findy/blob/main/docs/guide/browser-extension.md). Firefox can load it only as a temporary add-on for now.

### Documentation
- The README is shorter. Install steps, the first start and the AI assistant setup moved to `docs/guide/` in English and Ukrainian.
- New `PRIVACY.md`: what the app and the extension do with your data.

### For contributors
- `smoke:packaged` also checks the browser connector on all three systems.

## [0.6.1] - 2026-11-21

### Fixes
- **Check for updates** works again when GitHub spells the project name in other letter case. **Findy 0.5.0 always says that it cannot check for updates: download 0.6.1 from the Releases page once.** Findy 0.6.0 and later check as usual.
- If Findy cannot read the AI assistant connection, **⋯ → Settings… → AI assistant** now shows an error notification. Before, the connection steps did not show and there was no message.

### Security
- The app accepts calls to its data only from its own window.

### For contributors
- ESLint now checks the code layers: the pure domain, no zod in the window code, and the order `ui` → `hooks` → `features` → `app`.
- `docs/architecture.md` shows the current project structure.

## [0.6.0] - 2026-11-21

### Next step and reminders
- Give an application its next step: a short text, a date and, if you want, a time. Open the card and choose **Add next step**, or **⋯ → Next step…** on the card.
- The card shows **Today**, **Tomorrow**, a short date or **Overdue** (with its own icon). A card in Rejected keeps its step but shows no mark.
- **Done** removes the step and adds a note "Done: … (date, time)". **Remove step** adds no note.
- While Findy runs, it shows a system notification **15 minutes** and **1 minute** before a step that has a time. A click opens the application. Turn reminders off in **⋯ → Settings… → Reminders**. On macOS, allow notifications for Findy in **System Settings → Notifications**.
- **Add to calendar** saves the step as an `.ics` file for Google Calendar, Apple Calendar or Outlook: a one-hour event, or an all-day event without a time.
- Search, CSV (two new columns) and the AI assistant tools also know the step.

### Salary, work format, location, source and contact
- Each application can keep a salary range with a currency (USD, EUR, UAH, GBP, PLN) and a period, the work format (remote, office, hybrid), a location, where you found the vacancy, and the recruiter with their contact.
- The card shows the work format and the salary. The source fills in from a job site link.
- Search, CSV export and import, and the AI assistant tools know the new fields.

### One settings window
- **⋯ → Settings…** or **Cmd/Ctrl+,** opens one window with a side list: General (language, theme System / Light / Dark), Board (columns, days without movement), Reminders, Updates and AI assistant.
- The **⋯** menu now holds only actions. "Columns…", "Stale after…", the language submenu, the theme switch and "AI assistant access…" moved into the window.

### A skill for AI assistants
- The Findy skill tells Claude (or another assistant with Agent Skills) how to use Findy's MCP tools: add applications, update them after an interview, review your job search, prepare for an interview.
- Claude Code: install it with one command from **⋯ → Settings… → AI assistant** or the README; run it again to update. Claude Desktop and claude.ai: **Save skill…** and upload the file.

### Changes
- The offer question has no **Not now** button any more. Close it with ×, Esc or a click outside, and it asks again on your next offer.
- Dialogs have one scroll area and space below the last line.

### Fixes
- The search query of the **Sites** tab is kept when you change the tab or quit right after typing.

### Data
- The database gets two new versions (application fields, next step). Findy backs it up before the update. **Findy 0.5.0 and older cannot open a database after 0.6.0 has opened it**: update every computer that uses the same data.

## [0.5.0] - 2026-11-20

### Congratulations on an offer
- Move an application to **Offer** and confetti falls over the window. There is no confetti when your system is set to reduce motion.
- The first time, Findy also asks if it helped with your job search. **Yes** shows how to support the project (Ko-fi) or star it on GitHub; **Not really** opens a page to tell us what to improve; **Not now** asks again on your next offer; **Don't ask again** ends it. Your answer stays on your computer.
- Only moves that you make in the app count: not a CSV import and not an AI assistant.

### Support Findy
- **⋯ → Support Findy…** and **Help → Support Findy…** open the project's Ko-fi page. Findy stays free; the first goal is an Apple Developer membership, so Findy opens on a Mac without a warning.

### Fixes
- Dialogs now put the focus on their main button when they open (for example, **Download** in the update dialog).

## [0.4.1] - 2026-11-19

### Install with Homebrew and Scoop
- macOS: `brew tap yuraberez/findy`, `brew trust yuraberez/findy`, `brew install --cask findy`. `brew upgrade --cask findy` gets new versions. Homebrew does not turn off the macOS check: open Findy the first time as **First start** in the README says.
- Windows: `scoop bucket add findy https://github.com/YuraBerez/scoop-findy`, `scoop install findy`. No administrator rights; `scoop update findy` gets new versions.
- Both follow published releases and update themselves within a day. Uninstalling keeps your data.

### Portable Windows build
- Each release now has `Findy-<version>-Windows-portable.zip`: unzip it and run `Findy.exe`, no installer.

### Check a download
- Each release has `SHA256SUMS.txt` with the SHA-256 sum of every file.
- Every file has a GitHub build attestation: `gh attestation verify <file> --repo YuraBerez/findy` confirms that the release workflow built it from this repository.

## [0.4.0] - 2026-11-19

### Add an application from a link
- Paste a vacancy link into **Add application**: Findy reads that page and fills in the **job title** and the **company**. Check the values and save; nothing is saved before you do. **Fill from link** does the same for a link that you typed.
- It reads the job data that most job sites publish for search engines and link previews, and the page title and heading. When a page gives nothing (for example, it needs a login, or you are offline), a short message says so and you fill in the fields yourself.
- Only that one page is read, only when you paste or press the button. No cookies, no logins and no data about you or your board are sent.

### No movement
- A card that stays in its stage for more than 14 days shows **No movement for N days**, so you know where to follow up. Offer and Rejected are never marked; only a move to another stage resets the count.
- **⋯ → Stale after…** changes the number of days (3–90).

### Job sites
- A new **Sites** tab (Cmd/Ctrl+3) with 14 job sites: Djinni, DOU, Work.ua, robota.ua, LinkedIn Jobs, Indeed, Glassdoor, Wellfound, Remote OK, We Work Remotely, Jooble, EuroJobs, StepStone and XING.
- Type your search once, for example *QA Engineer*: a click on a site opens its search results for it in your browser. The query is kept.
- Add your own sites, such as a company's careers page; put `{query}` in the address where your search goes. Hide the sites that you do not use.
- Each site shows its icon. Findy downloads it once from that site, with no data about you, and keeps it, so the tab works offline after that.

### Data
- The database gets a new version for your job sites. Findy backs it up before the update. **Findy 0.3.0 and older cannot open a database after 0.4.0 has opened it**: update every computer that uses the same data.

## [0.3.0] - 2026-11-18

### Card colours
- Give a card one of 7 colours (red, orange, yellow, green, blue, purple, grey) to mark what matters to you: **⋯ → Colour** on the card, or the **Colour** section in the details panel. **None** removes it.
- The card gets a soft tint and a border in its colour, in the light and the dark theme. Screen readers hear the colour name with the card.

### CSV export and import
- **⋯ → Export to CSV…** saves all applications to one file: title, company, link, stage, colour, dates, stage history and notes. It opens in Excel, Numbers or Google Sheets; headers and stage names are in the app language.
- **⋯ → Import from CSV…** adds applications from a file. A summary shows what will happen before anything changes: how many applications will be added, which rows have errors (with row numbers), and which are skipped as duplicates. Import never changes or deletes the applications that you already have.
- Your own table works too: only **Title** and **Company** columns are required, in English or Ukrainian.
- A file exported from Findy imports back with the same data, so you can use it as a copy or to move to another computer.

### Data
- The database gets a new version for the card colour. Findy backs it up before the update. **Findy 0.2.0 and older cannot open a database after 0.3.0 has opened it**: update every computer that uses the same data.

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
