import { describe, expect, it, vi } from 'vitest'
import { createImageSharer, imageFileName, type ImageSharerDeps } from '../../src/main/image'

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3])

function deps(path: string | null): ImageSharerDeps {
  return {
    writeClipboard: vi.fn(async () => {}),
    pickSavePath: vi.fn(async () => path),
    writeBytes: vi.fn(async () => {}),
    now: () => new Date(2026, 0, 5, 23, 30),
  }
}

describe('analytics image (spec 023)', () => {
  it('names the file with the local date (FR-022)', () => {
    expect(imageFileName(new Date(2026, 10, 28, 0, 5))).toBe('findy-analytics-2026-11-28.png')
  })

  it('copies the bytes to the clipboard (FR-021)', async () => {
    const d = deps(null)
    await createImageSharer(d).copy(PNG)
    expect(d.writeClipboard).toHaveBeenCalledWith(PNG)
  })

  it('proposes the name and writes the bytes to the picked path (FR-022)', async () => {
    const d = deps('/tmp/a.png')
    expect(await createImageSharer(d).save(PNG)).toEqual({ status: 'saved' })
    expect(d.pickSavePath).toHaveBeenCalledWith('findy-analytics-2026-01-05.png')
    expect(d.writeBytes).toHaveBeenCalledWith('/tmp/a.png', PNG)
  })

  it('a cancel writes nothing and is not an error (FR-022)', async () => {
    const d = deps(null)
    expect(await createImageSharer(d).save(PNG)).toEqual({ status: 'cancelled' })
    expect(d.writeBytes).not.toHaveBeenCalled()
  })

  it('a failed write rejects (FR-023)', async () => {
    const d = deps('/tmp/a.png')
    d.writeBytes = vi.fn(async () => {
      throw new Error('EACCES')
    })
    await expect(createImageSharer(d).save(PNG)).rejects.toThrow('EACCES')
  })
})
