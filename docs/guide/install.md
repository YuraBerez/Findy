# Install Findy

[Українською](install.uk.md)

How to install Findy with a package manager, check a download, and open the app the
first time.

## Install with Homebrew (macOS)

```bash
brew tap yuraberez/findy
brew trust yuraberez/findy
brew install --cask findy
```

`brew trust` is needed once: Homebrew loads casks from taps outside its own catalogue
only after you trust them. Update with `brew upgrade --cask findy`. The
[tap](https://github.com/YuraBerez/homebrew-findy) follows each published release within
a day. The first start still needs the steps below.

## Install with Scoop (Windows)

```powershell
scoop bucket add findy https://github.com/YuraBerez/scoop-findy
scoop install findy
```

Update with `scoop update findy`. The [bucket](https://github.com/YuraBerez/scoop-findy)
installs the portable build for your user, without administrator rights (from Findy
0.4.1).

## Check a download

Each release (from 0.4.1) has `SHA256SUMS.txt` with the sum of every file, and GitHub
records which workflow and commit built each one:

```bash
shasum -a 256 -c SHA256SUMS.txt --ignore-missing      # macOS, Linux
gh attestation verify Findy-x.y.z-macOS-Apple-Silicon.dmg --repo YuraBerez/findy
```

On Windows: `Get-FileHash Findy-Setup-x.y.z.exe` and compare with `SHA256SUMS.txt`.

## First start: the builds are not signed yet

Code-signing certificates cost money, so the builds are not signed. macOS and
Windows show a warning the first time you open Findy. The builds come from the
public source code on GitHub Actions. Do these steps one time only.

### macOS

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

### Windows

1. Download `Findy-Setup-x.y.z.exe`. If the browser warns that the file is not
   commonly downloaded, select **Keep** (Edge: **⋯ → Keep → Show more → Keep
   anyway**).
2. Run the file. On *Windows protected your PC* (SmartScreen), click
   **More info**, then **Run anyway**.
3. Follow the installer. Then start Findy from the Start menu.

### Linux

- **AppImage:** make the file executable and run it:
  ```bash
  chmod +x Findy-*.AppImage
  ./Findy-*.AppImage
  ```
  On Ubuntu 22.04 and newer, an AppImage needs FUSE 2:
  `sudo apt install libfuse2` (Ubuntu 24.04: `sudo apt install libfuse2t64`).
- **Debian / Ubuntu package:** `sudo apt install ./findy_x.y.z_amd64.deb`.


← [Back to README](../../README.md)
