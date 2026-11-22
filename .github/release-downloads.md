## Which file to download

| Your computer | File |
|---|---|
| Mac with Apple Silicon (M1, M2, M3, M4…) | [Findy-VERSION-macOS-Apple-Silicon.dmg](https://github.com/YuraBerez/findy/releases/download/vVERSION/Findy-VERSION-macOS-Apple-Silicon.dmg) |
| Mac with an Intel processor | [Findy-VERSION-macOS-Intel.dmg](https://github.com/YuraBerez/findy/releases/download/vVERSION/Findy-VERSION-macOS-Intel.dmg) |
| Windows 10/11 (64-bit) | [Findy-Setup-VERSION.exe](https://github.com/YuraBerez/findy/releases/download/vVERSION/Findy-Setup-VERSION.exe) |
| Windows, portable (no install) | [Findy-VERSION-Windows-portable.zip](https://github.com/YuraBerez/findy/releases/download/vVERSION/Findy-VERSION-Windows-portable.zip) |
| Linux, any distribution | [Findy-VERSION.AppImage](https://github.com/YuraBerez/findy/releases/download/vVERSION/Findy-VERSION.AppImage) |
| Debian, Ubuntu | [findy_VERSION_amd64.deb](https://github.com/YuraBerez/findy/releases/download/vVERSION/findy_VERSION_amd64.deb) |

**Browser extension:** [Findy-VERSION-browser-extension.zip](https://github.com/YuraBerez/findy/releases/download/vVERSION/Findy-VERSION-browser-extension.zip) for Chrome, Edge, Brave, Opera and Vivaldi; [Findy-VERSION-browser-extension-Firefox.zip](https://github.com/YuraBerez/findy/releases/download/vVERSION/Findy-VERSION-browser-extension-Firefox.zip) for Firefox. [How to install](https://github.com/YuraBerez/findy/blob/main/docs/guide/browser-extension.md).

**Which Mac do I have?** Open the Apple menu → **About This Mac**. **Chip: Apple M…** means Apple Silicon. **Processor: Intel…** means Intel.

**With a package manager:** `brew tap yuraberez/findy && brew trust yuraberez/findy && brew install --cask findy` (macOS) · `scoop bucket add findy https://github.com/YuraBerez/scoop-findy && scoop install findy` (Windows).

**Check a download:** compare it with `SHA256SUMS.txt`, or run `gh attestation verify <file> --repo YuraBerez/findy`.

