// Spec 019: the small part of the extension API that the popup uses. Chromium and Firefox
// both give it as `chrome.*` with promises in Manifest V3; no type package is needed.
declare namespace chrome {
  namespace tabs {
    interface Tab {
      id?: number
      url?: string
    }
    function query(filter: { active: true; currentWindow: true }): Promise<Tab[]>
  }
  namespace scripting {
    function executeScript<T>(details: {
      target: { tabId: number }
      func: () => T
    }): Promise<{ result?: T }[]>
  }
  namespace runtime {
    function sendNativeMessage(application: string, message: object): Promise<unknown>
  }
  namespace i18n {
    function getUILanguage(): string
  }
}
