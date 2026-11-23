import { describe, expect, it } from 'vitest'
import { detectOs } from '../../src/lib/os'

const desktop = { maxTouchPoints: 0 }

describe('system of the visitor (spec 020 FR-011, FR-013)', () => {
  it('finds Windows', () => {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0'
    expect(detectOs({ ...desktop, userAgent, platform: 'Win32' })).toBe('windows')
    expect(detectOs({ ...desktop, userAgent, platform: 'Windows' })).toBe('windows')
  })

  it('finds macOS', () => {
    const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15'
    expect(detectOs({ ...desktop, userAgent, platform: 'MacIntel' })).toBe('mac')
    expect(detectOs({ ...desktop, userAgent, platform: 'macOS' })).toBe('mac')
  })

  it('finds Linux', () => {
    const userAgent = 'Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Firefox/140.0'
    expect(detectOs({ ...desktop, userAgent, platform: 'Linux x86_64' })).toBe('linux')
    expect(detectOs({ ...desktop, userAgent: 'Mozilla/5.0 (X11)', platform: '' })).toBe('linux')
  })

  it('gives no system for phones, tablets and ChromeOS', () => {
    const android = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) Mobile Safari/537.36'
    expect(detectOs({ userAgent: android, platform: 'Linux armv8l', maxTouchPoints: 5 })).toBe(null)
    const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148'
    expect(detectOs({ userAgent: iphone, platform: 'iPhone', maxTouchPoints: 5 })).toBe(null)
    const ipad = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15'
    expect(detectOs({ userAgent: ipad, platform: 'MacIntel', maxTouchPoints: 5 })).toBe(null)
    const cros = 'Mozilla/5.0 (X11; CrOS x86_64 16000.0.0) Chrome/140.0'
    expect(detectOs({ ...desktop, userAgent: cros, platform: 'Linux x86_64' })).toBe(null)
    expect(detectOs({ ...desktop, userAgent: 'Mozilla/5.0', platform: 'Chrome OS' })).toBe(null)
  })

  it('gives no system when it is not clear', () => {
    expect(detectOs({ ...desktop, userAgent: 'curl/8.0', platform: '' })).toBe(null)
  })
})
