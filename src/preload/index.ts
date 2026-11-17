import { contextBridge, ipcRenderer } from 'electron'
import {
  CHANNEL_PREFIX,
  IPC_EVENTS,
  IPC_METHODS,
  unwrap,
  type FindyApi,
  type IpcEvent,
  type IpcResult,
} from '../shared/ipc'

// Only the calls from docs/contracts/ipc.md are exposed; never raw ipcRenderer.
const methods = Object.fromEntries(
  IPC_METHODS.map((method) => [
    method,
    async (...args: unknown[]) =>
      unwrap((await ipcRenderer.invoke(CHANNEL_PREFIX + method, ...args)) as IpcResult<unknown>),
  ]),
)

const api = {
  ...methods,
  on(event: IpcEvent, handler: (payload: unknown) => void) {
    if (!IPC_EVENTS.includes(event)) throw new Error(`Unknown event: ${event}`)
    const listener = (_: Electron.IpcRendererEvent, payload: unknown) => handler(payload)
    ipcRenderer.on(CHANNEL_PREFIX + event, listener)
    return () => {
      ipcRenderer.removeListener(CHANNEL_PREFIX + event, listener)
    }
  },
} as FindyApi

contextBridge.exposeInMainWorld('findy', api)
