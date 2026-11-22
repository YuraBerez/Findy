// Spec 019 FR-001, FR-002: the job title and the company of the active tab, read only when
// the popup opens. Nothing is kept.
import { extractVacancy, type VacancyData } from '@domain/vacancy'

/** Spec 009 NFR-002: the same 2 MB limit as a page that Findy reads itself */
export const MAX_PAGE_CHARS = 2 * 1024 * 1024

export interface OpenPage {
  url: string
  vacancy: VacancyData
}

export interface PageApi {
  activeTab(): Promise<{ id?: number; url?: string } | undefined>
  html(tabId: number): Promise<string | undefined>
}

export const browserPage: PageApi = {
  activeTab: async () => (await chrome.tabs.query({ active: true, currentWindow: true }))[0],
  html: async (tabId) =>
    (
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => document.documentElement.outerHTML,
      })
    )[0]?.result,
}

const isWebPage = (url: string | undefined): url is string => !!url && /^https?:\/\//i.test(url)

/** `null` for a tab that is not an http(s) page (US-3.3) */
export async function readOpenPage(api: PageApi = browserPage): Promise<OpenPage | null> {
  const tab = await api.activeTab()
  if (!tab?.id || !isWebPage(tab.url)) return null
  let html = ''
  try {
    html = ((await api.html(tab.id)) ?? '').slice(0, MAX_PAGE_CHARS)
  } catch {
    // A page that the browser protects (a store page): no values, the user types them
  }
  return { url: tab.url, vacancy: extractVacancy(html, tab.url) }
}
