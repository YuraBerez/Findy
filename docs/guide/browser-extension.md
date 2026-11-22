# Add a vacancy from the browser

[Українською](browser-extension.uk.md)

The Findy browser extension adds the vacancy that you see to your board in one click. On
a vacancy page, click the Findy button in the toolbar (or press **Alt+Shift+F**). The
extension shows the job title, the company and the link from the page. Correct them if
necessary and click **Add to Findy**. The application goes to the "Applied" stage. If you
already added this vacancy, the extension shows its stage.

The extension works also on pages that need a login, for example LinkedIn, because it
reads the page as you see it. It talks only to the Findy app on your computer: it makes
no network requests and keeps no copy of the page.

The extension is not in the browser stores yet. Install it from the release:

1. Install Findy 0.7.0 or later and open it once. Findy then tells your browsers where it
   is.
2. Download `Findy-<version>-browser-extension.zip` from the
   [latest release](https://github.com/YuraBerez/findy/releases/latest) and unpack it
   into a folder that you keep (the browser loads the extension from this folder).
3. Load it in your browser:

**Chrome, Edge, Brave, Opera, Vivaldi**

1. Open `chrome://extensions` (Edge: `edge://extensions`, Brave: `brave://extensions`).
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select the unpacked folder.
4. Click the puzzle icon in the toolbar and pin Findy.

**Firefox**

1. Download `Findy-<version>-browser-extension-Firefox.zip` from the same release.
2. Open `about:debugging#/runtime/this-firefox` and click **Load Temporary Add-on…**.
3. Select the zip file.

Firefox removes a temporary add-on when it closes, so you load it again after each
restart. A permanent install comes with the signed version.

**If the extension says that Findy is not found:** open Findy once and try again. Browsers
in Flatpak or Snap cannot start Findy, so the extension does not work in them.

Privacy details: [PRIVACY.md](../../PRIVACY.md).

← [Back to README](../../README.md)
