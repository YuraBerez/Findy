# Contract: renderer ↔ main IPC

The renderer has no Node.js access. It sees a single object, `window.findy`,
exposed by the preload script through `contextBridge`. The shapes below are the
public contract; TypeScript types live in `src/shared/ipc.ts` and are shared by
main, preload and renderer.

The main process owns the state and the file. Every mutating call is validated
in main (schema + invariants from [data-model.md](../data-model.md)), applied,
persisted, and returns the new full state. Invalid input rejects with an
`IpcError` (`{ code: 'VALIDATION' | 'NOT_FOUND' | 'STORAGE', message }`).

```ts
interface FindyApi {
  // State
  getState(): Promise<AppState>;                       // { settings, applications, storage }

  // Applications
  createApplication(input: {
    title: string; company: string; url?: string | null; stage?: StageId;
  }): Promise<AppState>;
  updateApplication(id: string, patch: {
    title?: string; company?: string; url?: string | null;
  }): Promise<AppState>;
  moveApplication(id: string, to: { stage: StageId; index: number }): Promise<AppState>;
  deleteApplication(id: string): Promise<AppState>;

  // Notes
  addNote(applicationId: string, text: string): Promise<AppState>;
  updateNote(applicationId: string, noteId: string, text: string): Promise<AppState>;
  deleteNote(applicationId: string, noteId: string): Promise<AppState>;

  // Settings & system
  setLanguage(language: 'en' | 'uk'): Promise<AppState>;
  getSystemLocale(): Promise<string>;
  openExternal(url: string): Promise<void>;            // http/https only, else rejects
  getAppInfo(): Promise<{ version: string; dataFilePath: string }>;
}

interface AppState {
  settings: { language: 'en' | 'uk' | null };
  applications: Application[];
  storage: { status: 'ok' | 'error'; error?: string; dataFilePath: string };
}
```

## Channel naming

`findy:<verb>` — e.g. `findy:createApplication`. Implemented with
`ipcRenderer.invoke` / `ipcMain.handle` only (no `send`/`on` from the renderer).

## Events main → renderer

| Event | Payload | When |
|-------|---------|------|
| `findy:languageChanged` | `'en' \| 'uk'` | Language changed from the native app menu |
| `findy:storageError` | `{ message }` | Background save failed |

Renderer subscribes via `window.findy.on(event, handler)` which returns an
unsubscribe function.
