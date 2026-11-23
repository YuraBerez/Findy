/** Spec 020 FR-011: the systems that have a Findy build */
export type Os = 'windows' | 'mac' | 'linux'

export interface Client {
  userAgent: string
  /** `navigator.userAgentData.platform` when the browser has it, else `navigator.platform` */
  platform: string
  maxTouchPoints: number
}

const MOBILE = /android|iphone|ipad|ipod|mobile|cros/i

/**
 * The system of the visitor, or null when it has no Findy build or is not clear: phones,
 * tablets, ChromeOS (FR-013). iPadOS says "Macintosh" but has a touch screen.
 */
export function detectOs({ userAgent, platform, maxTouchPoints }: Client): Os | null {
  const text = `${platform} ${userAgent}`
  if (MOBILE.test(text) || /chrome os/i.test(platform)) return null
  if (/win/i.test(platform) || /windows/i.test(userAgent)) return 'windows'
  if (/mac/i.test(text)) return maxTouchPoints > 1 ? null : 'mac'
  if (/linux|x11/i.test(text)) return 'linux'
  return null
}
