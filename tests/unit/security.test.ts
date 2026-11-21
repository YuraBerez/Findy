import { describe, expect, it } from 'vitest'
import {
  isAllowedNavigation,
  isAppSender,
  isSafeExternalUrl,
  UNKNOWN_SENDER,
} from '../../src/main/security'

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

describe('isAppSender (docs/security.md)', () => {
  it('accepts only the app page', () => {
    expect(isAppSender('file:///app/out/renderer/index.html', undefined)).toBe(true)
    expect(isAppSender('https://evil.example/', undefined)).toBe(false)
    expect(isAppSender('http://localhost:5173/', 'http://localhost:5173')).toBe(true)
    expect(isAppSender('http://localhost:9999/', 'http://localhost:5173')).toBe(false)
  })

  it('rejects a sender frame that is already gone', () => {
    expect(isAppSender(undefined, undefined)).toBe(false)
  })

  it('answers an unknown sender with a validation error', () => {
    expect(UNKNOWN_SENDER).toEqual({
      ok: false,
      error: { code: 'VALIDATION', message: 'Unknown sender' },
    })
  })
})
