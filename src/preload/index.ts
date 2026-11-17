import { contextBridge } from 'electron'
import type { FindyApi } from '../shared/ipc'

// The full API from docs/contracts/ipc.md is added as features land (T016).
const api: FindyApi = {
  platform: process.platform,
}

contextBridge.exposeInMainWorld('findy', api)
