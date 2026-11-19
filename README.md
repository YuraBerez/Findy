<p align="center"><img src="assets/logo.svg" width="128" height="128" alt="Findy logo"></p>

# Findy

**A free, open-source desktop app to track your job search.**

[Українською](README.uk.md)

> **Status: 0.2.0, with analytics and an update check.** Download it from
> [Releases](https://github.com/YuraBerez/findy/releases). Feedback is welcome: use the
> *Found an issue?* button in the app.

Sending dozens of applications and losing track of which company is at which
stage? Findy keeps every application on a single board, from the moment you
apply until you get an offer.

![Findy board: applications in stage columns](docs/screenshots/board-en.png)

![Application details with notes, fields and stage history](docs/screenshots/details-en.png)

![Analytics: applications sent, stages over time, funnel and totals](docs/screenshots/analytics-en.png)

![Job sites: one search query, opened on any job site](docs/screenshots/sites-en.png)

## Features

- **Kanban board of your job search.** Every application is a card; columns are
  the stages of a hiring process:

  `Applied` → `HR interview` → `Test task` → `Technical interview` →
  `C-level interview` → `Offer` / `Rejected`

- **Quick add.** Job title, company and a link to the vacancy, and that's it.
- **Drag and drop** cards between stages (keyboard works too).
- **Notes on every application.** Who you talked to, salary discussed, next steps.
- **One click to the vacancy.** Cards with a link open it in your browser.
- **Add from a link.** Paste a vacancy link and Findy fills in the job title and the
  company from the page.
- **Card colours.** Mark cards with one of 7 colours from the card's **⋯** menu.
- **No movement.** Cards that stay in a stage for more than 14 days (you choose the
  number) are marked, so you know where to follow up.
- **Details panel.** Edit an application and see its stage history as a timeline.
- **Stage history.** Each card shows how long it has been in its stage.
- **Analytics.** See how many applications you send per day, week or month, how many
  HR, technical and C-level interviews you get, and how far your applications go in a
  funnel. Every chart can also show its numbers as a table.
- **Update check.** **⋯ → Check for updates…** tells you when a new version is out.
  Turn on the automatic check in the same menu if you want it (off by default).
- **CSV export and import.** Save the whole board to a file that opens in any
  spreadsheet, or add applications from your own table (**⋯ → Export to CSV…**,
  **Import from CSV…**). Import shows a summary first and never changes existing cards.
- **Job sites.** A **Sites** tab with 14 job sites (Djinni, DOU, Work.ua, LinkedIn,
  Indeed and more): type your search once and open it on any site in one click. Add
  your own sites and hide the ones you do not use.
- **English and Ukrainian** interface, **light and dark** theme.
- **Start over.** Reset the board in one step; Findy keeps a backup first.
- **Private by design.** Works offline, no account, no telemetry. Your data lives in a
  local SQLite database on your computer. Findy goes online only for what you ask:
  the update check (when you start it or turn it on), the vacancy page whose link you
  paste, and the icons of job sites (once each). None of these sends data about you or
  your board.
- **Windows, macOS and Linux.**

## Download

Installers are on the [Releases](https://github.com/YuraBerez/findy/releases) page:

| OS | File |
|----|------|
| Windows 10/11 (x64) | `Findy-Setup-x.y.z.exe` |
| Mac with Apple Silicon (M1, M2, M3, M4…) | `Findy-x.y.z-macOS-Apple-Silicon.dmg` |
| Mac with an Intel processor | `Findy-x.y.z-macOS-Intel.dmg` |
| Windows, portable (no install) | `Findy-x.y.z-Windows-portable.zip` |
| Linux (x64) | `Findy-x.y.z.AppImage` or `findy_x.y.z_amd64.deb` |

Findy needs macOS 13 Ventura or later, or Windows 10/11 (64-bit).

### Install with Homebrew (macOS)

```bash
brew tap yuraberez/findy
brew trust yuraberez/findy
brew install --cask findy
```

`brew trust` is needed once: Homebrew loads casks from taps outside its own catalogue
only after you trust them. Update with `brew upgrade --cask findy`. The
[tap](https://github.com/YuraBerez/homebrew-findy) follows each published release within
a day. The first start still needs the steps below.

### Install with Scoop (Windows)

```powershell
scoop bucket add findy https://github.com/YuraBerez/scoop-findy
scoop install findy
```

Update with `scoop update findy`. The [bucket](https://github.com/YuraBerez/scoop-findy)
installs the portable build for your user, without administrator rights (from Findy
0.4.1).

### Check a download

Each release (from 0.4.1) has `SHA256SUMS.txt` with the sum of every file, and GitHub
records which workflow and commit built each one:

```bash
shasum -a 256 -c SHA256SUMS.txt --ignore-missing      # macOS, Linux
gh attestation verify Findy-x.y.z-macOS-Apple-Silicon.dmg --repo YuraBerez/findy
```

On Windows: `Get-FileHash Findy-Setup-x.y.z.exe` and compare with `SHA256SUMS.txt`.

### First start: the builds are not signed yet

Code-signing certificates cost money, so the builds are not signed. macOS and
Windows show a warning the first time you open Findy. The builds come from the
public source code on GitHub Actions. Do these steps one time only.

#### macOS

To see which Mac you have, open the Apple menu → **About This Mac**: **Chip: Apple
M…** means Apple Silicon, **Processor: Intel…** means Intel.

1. Open the `.dmg` file and drag **Findy** to **Applications**.
2. Open Findy. macOS shows *"Findy" Not Opened* (or *cannot be opened because
   Apple cannot check it*). Click **Done**. Do not click *Move to Trash*.
3. Open **System Settings → Privacy & Security**. Scroll down to **Security**.
   Next to *"Findy" was blocked to protect your Mac*, click **Open Anyway**.
4. Enter your password, then click **Open Anyway** again. Findy starts.

On macOS 14 or earlier you can also Control-click Findy in Applications →
**Open** → **Open**.

If macOS says *"Findy" is damaged and can't be opened*, open **Terminal**, run
this command, and open Findy again:

```bash
xattr -dr com.apple.quarantine /Applications/Findy.app
```

Open Findy one time with these steps before you connect an AI assistant (MCP).
Until then, macOS blocks the assistant from starting Findy as well.

#### Windows

1. Download `Findy-Setup-x.y.z.exe`. If the browser warns that the file is not
   commonly downloaded, select **Keep** (Edge: **⋯ → Keep → Show more → Keep
   anyway**).
2. Run the file. On *Windows protected your PC* (SmartScreen), click
   **More info**, then **Run anyway**.
3. Follow the installer. Then start Findy from the Start menu.

#### Linux

- **AppImage:** make the file executable and run it:
  ```bash
  chmod +x Findy-*.AppImage
  ./Findy-*.AppImage
  ```
  On Ubuntu 22.04 and newer, an AppImage needs FUSE 2:
  `sudo apt install libfuse2` (Ubuntu 24.04: `sudo apt install libfuse2t64`).
- **Debian / Ubuntu package:** `sudo apt install ./findy_x.y.z_amd64.deb`.

## Run from source

Requirements: [Node.js](https://nodejs.org/) 22 LTS or newer, npm, Git.

```bash
git clone https://github.com/YuraBerez/findy.git
cd findy
npm install
npm run dev          # start the app with hot reload
```

Other commands:

| Command | What it does |
|---------|--------------|
| `npm run build` | Production build of the app code |
| `npm run dist` | Build an installer for your current OS into `dist/` |
| `npm test` | Unit tests |
| `npm run test:coverage` | Unit tests with the 80 % coverage gate |
| `npm run test:e2e` | End-to-end tests against the real app |
| `npm run lint` | Lint and type-check |

On Linux you may need the usual Electron system libraries
(`libgtk-3-0 libnss3 libasound2`); for building `.deb` packages also `fakeroot` and `dpkg`.

## Use Findy from Claude or another AI assistant (MCP)

Findy has a built-in [MCP](https://modelcontextprotocol.io) server, so an assistant can
add, move and annotate applications when you ask it to ("I applied to Acme as a
frontend developer", "move Globex to the technical interview").

1. In Findy open **⋯ → AI assistant access (MCP)…** and turn it on (it is off by default).
2. Copy the configuration it shows into your client:
   - **Claude Desktop / Cowork:** `claude_desktop_config.json` (Settings → Developer → Edit Config).
   - **Claude Code:** the `claude mcp add findy …` command from the same dialog.
   - **Gemini CLI, Cursor, VS Code, Windsurf, Zed, Codex CLI…:** the command, arguments
     and environment (`ELECTRON_RUN_AS_NODE=1`) from the dialog, transport stdio.
     The short form `<Findy> --mcp` also works.

Tools: list and get applications, list stages, add, update, move, add a note,
delete (the assistant asks you first). The same rules apply as in the app, and an
open Findy window shows the changes within a second.

**Privacy:** Findy itself sends your data nowhere. The assistant you connect sends
what it reads to its AI provider, and only when you ask it to work with your board.

## Where is my data?

| OS | Path |
|----|------|
| Windows | `%APPDATA%\Findy\findy.db` |
| macOS | `~/Library/Application Support/Findy/findy.db` |
| Linux | `~/.config/Findy/findy.db` |

It is a standard SQLite database: back it up to keep your board, or open it
with any SQLite tool. To get your applications as a table, use **⋯ → Export to CSV…**. The schema is documented in
[docs/contracts/database.md](docs/contracts/database.md).

## Contributing

Contributions are welcome: code, translations, bug reports, ideas.
Start with [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
