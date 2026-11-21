# Contract: renderer ↔ main IPC

The renderer has no Node.js access. It sees a single object, `window.findy`,
exposed by the preload script through `contextBridge`. The shapes below are the
public contract; TypeScript types live in `src/shared/ipc.ts` and are shared by
main, preload and renderer.

The main process owns the state and the file. Every mutating call is validated
in main (schema + invariants from [data-model.md](../data-model.md)), applied,
persisted, and returns the new full state. Invalid input rejects with an
`IpcError` (`{ code: 'VALIDATION' | 'NOT_FOUND' | 'STORAGE' | 'NETWORK', message }`).
`NETWORK` (spec 006) means that a manual update check failed.
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
  } & ApplicationFields): Promise<AppState>;           // no source → from the link (spec 014 FR-020)
  updateApplication(id: string, patch: {
    title?: string; company?: string; url?: string | null;
  } & ApplicationFields): Promise<AppState>;
  completeNextStep(id: string,                          // spec 015 FR-012: clears the step and adds
    language: 'en' | 'uk'): Promise<AppState>;           // the "Done" note; NOT_FOUND: no step
  saveNextStepCalendar(id: string): Promise<           // spec 015: .ics through the save dialog
    { status: 'saved' } | { status: 'cancelled' }>;      // STORAGE: write failed
  setApplicationColor(id: string,                       // spec 007; not in updateApplication,
    color: CardColor | null): Promise<AppState>;         // so the MCP update tool cannot set it
  moveApplication(id: string, to: { stage: StageId; index: number }): Promise<AppState>;
  deleteApplication(id: string): Promise<AppState>;
  resetBoard(): Promise<AppState>;                    // backup first, then delete all applications (FR-090…093)

  // CSV (spec 008): the paths stay in main; the system dialogs pick them
  exportCsv(language: 'en' | 'uk'): Promise<{ status: 'saved'; count: number } | { status: 'cancelled' }>;
  previewImport(): Promise<ImportPreview | null>;     // null: the open dialog was cancelled
  confirmImport(token: string): Promise<{ state: AppState; added: number }>;  // NOT_FOUND: old token

  // Notes
  addNote(applicationId: string, text: string): Promise<AppState>;
  updateNote(applicationId: string, noteId: string, text: string): Promise<AppState>;
  deleteNote(applicationId: string, noteId: string): Promise<AppState>;

  // Settings & system
  setLanguage(language: 'en' | 'uk'): Promise<AppState>;
  setTheme(theme: 'system' | 'light' | 'dark'): Promise<AppState>;  // sets nativeTheme.themeSource
  setHiddenStages(stages: StageId[]): Promise<AppState>;
  setAnalyticsView(view: {                              // spec 005
    period: '7d' | '30d' | '90d' | 'all'; grouping: 'day' | 'week' | 'month';
  }): Promise<AppState>;
  setAutoUpdateCheck(enabled: boolean): Promise<AppState>;  // spec 006
  setRemindersEnabled(enabled: boolean): Promise<AppState>;  // spec 015 FR-030
  setStaleAfterDays(days: number): Promise<AppState>;      // spec 010; VALIDATION unless a whole number 3–90
  answerOfferQuestion(): Promise<AppState>;                // spec 013; the offer question is never asked again
  checkForUpdates(trigger: 'manual' | 'auto'): Promise<     // spec 006
    | { status: 'available'; version: string; currentVersion: string; url: string }
    | { status: 'latest'; currentVersion: string }
    | null                                                  // 'auto' only: off, not due, or failed
  >;                                                        // 'manual' rejects with NETWORK
  // Job sites (spec 011)
  addSite(site: { name: string; url: string }): Promise<AppState>;   // VALIDATION; at most 50
  updateSite(id: string, site: { name: string; url: string }): Promise<AppState>;  // NOT_FOUND
  deleteSite(id: string): Promise<AppState>;                         // NOT_FOUND
  setHiddenSites(ids: KnownSiteId[]): Promise<AppState>;
  setSiteQuery(query: string): Promise<AppState>;                    // trimmed, ≤ 200
  getSiteIcons(): Promise<Record<string, string>>;                   // host → data: URL
  refreshSiteIcons(): Promise<void>;          // downloads missing icons in the background
  readVacancy(url: string): Promise<                       // spec 009; VALIDATION: not http(s)
    { title: string | null; company: string | null } | null // null: no data, no network, not HTML
  >;                                                        // never rejects for a failed read
  setMcpEnabled(enabled: boolean): Promise<AppState>;    // spec 004
  getMcpConnection(): Promise<{ command: string; args: string[] }>;  // spec 004 FR-009
  saveSkill(): Promise<{ status: 'saved' } | { status: 'cancelled' }>;  // spec 016; STORAGE: write failed; no database needed  // spec 002; rejects all-hidden and duplicates
  on(event: 'languageChanged' | 'storageError', handler: (payload: unknown) => void): () => void;
  getSystemLocale(): Promise<string>;
  openExternal(url: string): Promise<void>;            // http/https only, else rejects
  getAppInfo(): Promise<{ version: string; dataFilePath: string }>;
}

interface AppState {
  settings: {
    language: 'en' | 'uk' | null; theme: 'system' | 'light' | 'dark'; hiddenStages: StageId[];
    mcpEnabled: boolean; autoUpdateCheck: boolean; analytics: { period: '7d' | '30d' | '90d' | 'all'; grouping: 'day' | 'week' | 'month' };
  };
  applications: Application[];
  sites: CustomSite[];                     // spec 011: the user's job sites
  storage:
    | { status: 'ok'; dataFilePath: string }
    | { status: 'error'; error: 'corrupt' | 'newer_version' | 'open_failed';
        dataFilePath: string; backupPath: string | null };
}
```

```ts
interface ApplicationFields {                         // spec 014; null clears, missing keeps
  salary?: Salary | null; workFormat?: WorkFormat | null; location?: string | null;
  source?: ApplicationSource | null; contactName?: string | null; contactDetails?: string | null;
  nextStep?: { text: string; date: string; time?: string | null } | null;  // spec 015; not in ApplicationFields
}
```

```ts
interface ImportPreview {                             // spec 008 FR-020; nothing changed yet
  token: string | null;                               // null: nothing to add
  fileName: string;                                   // base name only
  fatal: null
    | { reason: 'notCsv' | 'tooLarge' | 'tooManyRows' | 'noRows' }
    | { reason: 'missingColumns'; columns: ('title' | 'company')[] };
  toAdd: number; duplicates: number; hidden: number;
  errors: { row: number; field: Column; problem: 'required' | 'tooLong' | 'invalid' }[];
}
```

`confirmImport` plans the rows of the previewed file again against the current board
and adds them in one transaction. A token works once; a new preview replaces it.

## Channel naming

`findy:<verb>` — e.g. `findy:createApplication`. Implemented with
`ipcRenderer.invoke` / `ipcMain.handle` only (no `send`/`on` from the renderer).

## Events main → renderer

| Event | Payload | When |
|-------|---------|------|
| `findy:languageChanged` | `'en' \| 'uk'` | Language changed from the native app menu |
| `findy:storageError` | `{ message }` | Background save failed |
| `findy:stateChanged` | — | Another process (the MCP server) changed the database; reload (spec 004) |
| `findy:openApplication` | `string` (application id) | The user clicked a step notification; open its details (spec 015) |
| `findy:siteIconsChanged` | — | Main saved a site icon; call `getSiteIcons` again (spec 011) |

Renderer subscribes via `window.findy.on(event, handler)` which returns an
unsubscribe function.
