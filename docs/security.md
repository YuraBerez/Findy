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
- [ ] Outbound network: only the update check (constitution §II.6, spec 006), from main
      with `net.fetch`, never from the renderer. It is a GET with no user data, a 10 s
      timeout and a size limit; the answer is parsed with zod, and "Download" opens only
      `https://github.com/YuraBerez/findy/releases/…`. `FINDY_RELEASES_URL` replaces the
      API URL for e2e tests only.
