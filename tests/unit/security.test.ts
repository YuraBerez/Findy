import { describe, expect, it } from 'vitest'
import { isAllowedNavigation, isSafeExternalUrl } from '../../src/main/security'

describe('isSafeExternalUrl (FR-015)', () => {
  it.each([
    ['https://acme.com/jobs/1', true],
    ['http://acme.com', true],
    ['file:///etc/passwd', false],
    ['javascript:alert(1)', false],
    ['smb://server/share', false],
    ['', false],
  ])('%s → %s', (url, expected) => {
    expect(isSafeExternalUrl(url)).toBe(expected)
  })
})

describe('isAllowedNavigation', () => {
  it('allows only the bundled file in production', () => {
    expect(isAllowedNavigation('file:///app/out/renderer/index.html', undefined)).toBe(true)
    expect(isAllowedNavigation('https://evil.example', undefined)).toBe(false)
  })

  it('allows only the dev server origin in development', () => {
    const dev = 'http://localhost:5173'
    expect(isAllowedNavigation('http://localhost:5173/index.html', dev)).toBe(true)
    expect(isAllowedNavigation('http://localhost:9999/', dev)).toBe(false)
    expect(isAllowedNavigation('file:///x', dev)).toBe(false)
  })

  it('rejects garbage', () => {
    expect(isAllowedNavigation('not a url', undefined)).toBe(false)
  })
})
