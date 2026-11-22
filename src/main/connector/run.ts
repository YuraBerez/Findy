// Spec 019: one request from stdin, one answer to stdout (docs/contracts/native-messaging.md)
import type { Repository } from '../db/repository'
import { encodeFrame, readFrame } from './codec'
import { connectorError, handleRequest, type ConnectorAnswer } from './handler'

export interface ConnectorRun {
  version: string
  /** Opens the database only for a request that needs it */
  open: () => { repository: Repository | null; storageProblem: string; close: () => void }
  input?: NodeJS.ReadableStream
  output?: NodeJS.WritableStream
}

/** Resolves with the exit code: 0 after an answer, 1 when no answer could be read */
export async function runConnector({
  version,
  open,
  input = process.stdin,
  output = process.stdout,
}: ConnectorRun): Promise<number> {
  let answer: ConnectorAnswer
  let code = 0
  try {
    const request = await readFrame(input)
    if ((request as { type?: unknown } | null)?.type === 'hello') {
      answer = handleRequest(request, { repository: null, version, storageProblem: '' })
    } else {
      const database = open()
      try {
        answer = handleRequest(request, { ...database, version })
      } finally {
        database.close()
      }
    }
  } catch (error) {
    answer = connectorError('PROTOCOL', error instanceof Error ? error.message : String(error))
    code = 1
  }
  await new Promise<void>((resolve) => output.write(encodeFrame(answer), () => resolve()))
  return code
}
