# Security

Implements constitution §III. Checked in code review for every PR touching
`src/main` or `src/preload`.

## BrowserWindow

```ts
webPreferences: {
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
  webSecurity: true,
  preload: join(__dirname, '../preload/index.js'),
}
```

## Checklist

- [ ] CSP via response header / meta: `default-src 'self'; script-src 'self';
      style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'`
      (dev server origin allowed only in development).
- [ ] `webContents.setWindowOpenHandler` denies all; `will-navigate` blocked.
- [ ] `openExternal` only after `new URL(url)` with protocol `http:`/`https:`.
- [ ] Preload exposes only the functions in [contracts/ipc.md](contracts/ipc.md);
      never raw `ipcRenderer`.
- [ ] Every `ipcMain.handle` parses its arguments with zod before use.
- [ ] Single-instance lock (`app.requestSingleInstanceLock`).
- [ ] No `remote` module, no `eval`, no `dangerouslySetInnerHTML` for user content.
- [ ] Electron kept on a supported major version (Dependabot).
- [ ] Outbound network: only the update check, the vacancy page and the job site icons
      (next items). The
      update check (constitution §II.6, spec 006) runs from main
      with `net.fetch`, never from the renderer. It is a GET with no user data, a 10 s
      timeout and a size limit; the answer is parsed with zod, and "Download" opens only
      `https://github.com/YuraBerez/Findy/releases/tag/…` (`RELEASE_PAGE_PREFIX`,
      compared without letter case, because GitHub names are not case-sensitive:
      `isReleasePage`). `FINDY_RELEASES_URL` replaces the
      API URL for e2e tests; a packaged app ignores it.
- [ ] Vacancy pages (constitution §II.7, spec 009), never from the renderer: main reads only the link that the
      user pasted or asked to read, with Node's `fetch` (no cookie store), `credentials:
      'omit'` and no user data. Each redirect is checked: at most 5, only `http`/`https`.
      Only HTML is read, at most 2 MB in 10 s. The page is searched as text: never
      rendered, never run, never stored.
- [ ] Job site icons (constitution §II.8, spec 011), never from the renderer: main asks
      only the site's own host (or a subdomain / `www.` of it) with Node's `fetch`, no
      cookies and no user data; at most 5 checked redirects; 5 s; at most 100 KB. The
      type comes from the bytes (PNG, ICO, JPEG, GIF, WebP); SVG is refused, so an icon
      cannot carry a script. Icons reach the renderer as `data:` images. Sites open only
      in the system browser (`openExternal`).
- [ ] User files (spec 008): main reads or writes only a path that the user picked in
      a system save or open dialog. The renderer never sends or receives a path: it gets
      the file name, counts and a random token. Import checks the size (10 MB) before
      it reads the file. Export puts an apostrophe before a cell that starts with `=`,
      `+`, `-`, `@`, a tab or a CR, so a spreadsheet does not run it as a formula.
