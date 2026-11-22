// Spec 019: native messaging frames (docs/contracts/native-messaging.md). Each message is
// a 32-bit length in little-endian byte order, then that many bytes of UTF-8 JSON.

/** NFR-002: the largest message the connector accepts from the extension */
export const MAX_REQUEST_BYTES = 64 * 1024

const HEADER_BYTES = 4

export class FrameError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FrameError'
  }
}

/** One frame with `value` as JSON */
export function encodeFrame(value: unknown): Buffer {
  const body = Buffer.from(JSON.stringify(value), 'utf8')
  const header = Buffer.alloc(HEADER_BYTES)
  header.writeUInt32LE(body.length, 0)
  return Buffer.concat([header, body])
}

/**
 * Reads the first frame of `input` and parses its JSON. Rejects with `FrameError` when the
 * stream ends early, the frame is larger than `maxBytes`, or the body is not JSON.
 */
export function readFrame(
  input: NodeJS.ReadableStream,
  maxBytes: number = MAX_REQUEST_BYTES,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let buffered = Buffer.alloc(0)
    let done = false
    const finish = (error: Error | null, value?: unknown): void => {
      if (done) return
      done = true
      input.off('data', onData)
      input.off('end', onEnd)
      input.off('error', onEnd)
      if (error) reject(error)
      else resolve(value)
    }
    const onData = (chunk: Buffer | string): void => {
      buffered = Buffer.concat([buffered, Buffer.from(chunk)])
      if (buffered.length < HEADER_BYTES) return
      const length = buffered.readUInt32LE(0)
      if (length > maxBytes)
        return finish(new FrameError(`Message is larger than ${maxBytes} bytes`))
      if (buffered.length < HEADER_BYTES + length) return
      try {
        finish(
          null,
          JSON.parse(buffered.subarray(HEADER_BYTES, HEADER_BYTES + length).toString('utf8')),
        )
      } catch {
        finish(new FrameError('Message is not JSON'))
      }
    }
    const onEnd = (): void => finish(new FrameError('The input ended before a whole message'))
    input.on('data', onData)
    input.on('end', onEnd)
    input.on('error', onEnd)
  })
}
