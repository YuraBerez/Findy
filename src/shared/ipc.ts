// Renderer ↔ main contract: docs/contracts/ipc.md
export interface FindyApi {
  platform: string
}

declare global {
  interface Window {
    findy: FindyApi
  }
}
