# Contract: renderer ↔ main IPC

The renderer has no Node.js access. It sees a single object, `window.findy`,
exposed by the preload script through `contextBridge`. The shapes below are the
public contract; TypeScript types live in `src/shared/ipc.ts` and are shared by
main, preload and renderer.

The main process owns the state and the file. Every mutating call is validated
in main (schema + invariants from [data-model.md](../data-model.md)), applied,
persisted, and returns the new full state. Invalid input rejects with an
`IpcError` (`{ code: 'VALIDATION' | 'NOT_FOUND' | 'STORAGE', message }`).
`createApplication` and `moveApplication` into a hidden stage (spec 002) reject
with `VALIDATION`.

Handlers resolve with an envelope `{ ok: true, data } | { ok: false, error }`; the
preload unwraps it and throws `IpcError`. `contextBridge` keeps only an error's
message, so the message starts with the code (`"VALIDATION: …"`). The renderer reads
it with `getIpcErrorCode(error)` from `src/shared/ipc.ts`.

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
  resetBoard(): Promise<AppState>;                    // backup first, then delete all applications (FR-090…093)

  // Notes
  addNote(applicationId: string, text: string): Promise<AppState>;
  updateNote(applicationId: string, noteId: string, text: string): Promise<AppState>;
  deleteNote(applicationId: string, noteId: string): Promise<AppState>;

  // Settings & system
  setLanguage(language: 'en' | 'uk'): Promise<AppState>;
  setTheme(theme: 'system' | 'light' | 'dark'): Promise<AppState>;  // sets nativeTheme.themeSource
  setHiddenStages(stages: StageId[]): Promise<AppState>;  // spec 002; rejects all-hidden and duplicates
  on(event: 'languageChanged' | 'storageError', handler: (payload: unknown) => void): () => void;
  getSystemLocale(): Promise<string>;
  openExternal(url: string): Promise<void>;            // http/https only, else rejects
  getAppInfo(): Promise<{ version: string; dataFilePath: string }>;
}

interface AppState {
  settings: { language: 'en' | 'uk' | null; theme: 'system' | 'light' | 'dark'; hiddenStages: StageId[] };
  applications: Application[];
  storage:
    | { status: 'ok'; dataFilePath: string }
    | { status: 'error'; error: 'corrupt' | 'newer_version' | 'open_failed';
        dataFilePath: string; backupPath: string | null };
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
